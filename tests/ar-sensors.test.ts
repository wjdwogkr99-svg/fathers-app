import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import type { HeadingFix, PositionFix, PostureFix } from '../src/ar/readiness';

const mocks=vi.hoisted(()=>({
  getPermission:vi.fn(),requestPermission:vi.fn(),services:vi.fn(),
  watchPosition:vi.fn(),watchHeading:vi.fn(),available:vi.fn(),motionPermission:vi.fn(),
  interval:vi.fn(),addListener:vi.fn(),
}));
vi.mock('expo-location',()=>({
  Accuracy:{High:4},getForegroundPermissionsAsync:mocks.getPermission,
  requestForegroundPermissionsAsync:mocks.requestPermission,hasServicesEnabledAsync:mocks.services,
  watchPositionAsync:mocks.watchPosition,watchHeadingAsync:mocks.watchHeading,
}));
vi.mock('expo-sensors',()=>({Accelerometer:{isAvailableAsync:mocks.available,
  requestPermissionsAsync:mocks.motionPermission,setUpdateInterval:mocks.interval,addListener:mocks.addListener}}));
import { usePeakSensors } from '../src/ar/usePeakSensors';

(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let latest:{position:PositionFix|null;heading:HeadingFix|null;posture:PostureFix|null;error:string|null};
function Probe({enabled,retry=0}:{enabled:boolean;retry?:number}){
  latest=usePeakSensors(enabled,retry);return null;
}
const deferred=<T,>()=>{let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};};
let root:ReactTestRenderer|undefined;
let locationRemove:ReturnType<typeof vi.fn>,headingRemove:ReturnType<typeof vi.fn>,motionRemove:ReturnType<typeof vi.fn>;
beforeEach(()=>{
  vi.resetAllMocks();
  locationRemove=vi.fn();headingRemove=vi.fn();motionRemove=vi.fn();
  mocks.getPermission.mockResolvedValue({status:'granted'});
  mocks.services.mockResolvedValue(true);
  mocks.watchPosition.mockResolvedValue({remove:locationRemove});
  mocks.watchHeading.mockResolvedValue({remove:headingRemove});
  mocks.available.mockResolvedValue(true);
  mocks.motionPermission.mockResolvedValue({granted:true});
  mocks.addListener.mockReturnValue({remove:motionRemove});
});
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;});
async function mount(enabled=true){await act(async()=>{root=create(createElement(Probe,{enabled}));});}

describe('read-only AR sensor lifecycle',()=>{
  it('does not request or subscribe while screen is inactive',async()=>{
    await mount(false);
    expect(mocks.getPermission).not.toHaveBeenCalled();
    expect(mocks.watchPosition).not.toHaveBeenCalled();
    expect(mocks.addListener).not.toHaveBeenCalled();
  });
  it('removes all subscriptions and clears fixes when the screen loses focus',async()=>{
    await mount();
    await act(async()=>{
      mocks.watchPosition.mock.calls[0][1]({coords:{latitude:37,longitude:127,accuracy:5},timestamp:100});
      mocks.watchHeading.mock.calls[0][0]({trueHeading:-1,magHeading:120,accuracy:3});
      mocks.addListener.mock.calls[0][0]({x:0,y:-1,z:0});
    });
    expect(latest.position?.accuracyM).toBe(5);
    expect(latest.heading?.degrees).toBe(-1); // never relabel magnetic north as true north
    expect(latest.posture?.steady).toBe(true);
    await act(async()=>root!.update(createElement(Probe,{enabled:false})));
    expect(locationRemove).toHaveBeenCalledOnce();
    expect(headingRemove).toHaveBeenCalledOnce();
    expect(motionRemove).toHaveBeenCalledOnce();
    expect(latest.position).toBeNull();expect(latest.heading).toBeNull();
  });
  it('removes subscriptions that resolve after unmount',async()=>{
    const location=deferred<{remove:()=>void}>(),heading=deferred<{remove:()=>void}>();
    mocks.watchPosition.mockReturnValue(location.promise);mocks.watchHeading.mockReturnValue(heading.promise);
    await mount();
    await act(async()=>root!.unmount());root=undefined;
    await act(async()=>{location.resolve({remove:locationRemove});heading.resolve({remove:headingRemove});});
    expect(locationRemove).toHaveBeenCalledOnce();expect(headingRemove).toHaveBeenCalledOnce();
    expect(motionRemove).toHaveBeenCalledOnce();
  });
  it('does not start late subscriptions after a permission prompt outlives the screen',async()=>{
    const permission=deferred<{status:string}>();
    mocks.getPermission.mockResolvedValue({status:'undetermined'});mocks.requestPermission.mockReturnValue(permission.promise);
    await mount();await act(async()=>root!.unmount());root=undefined;
    await act(async()=>permission.resolve({status:'granted'}));
    expect(mocks.watchPosition).not.toHaveBeenCalled();expect(mocks.watchHeading).not.toHaveBeenCalled();
  });
  it('reports denial, then allows a deliberate retry without duplicated watchers',async()=>{
    mocks.getPermission.mockResolvedValueOnce({status:'denied'});
    mocks.requestPermission.mockResolvedValue({status:'denied'});
    await mount();expect(latest.error).toContain('위치');expect(mocks.watchPosition).not.toHaveBeenCalled();
    await act(async()=>root!.update(createElement(Probe,{enabled:true,retry:1})));
    expect(latest.error).toBeNull();expect(mocks.watchPosition).toHaveBeenCalledOnce();
  });
});
