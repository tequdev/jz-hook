/**
 * Xahau Hook host module — registers Hook API bindings and stdlib lowerings.
 * Only active when ctx.transform.host === 'hook'.
 */
import setupApi from './api.js'
import setupTrace from './trace.js'
import setupControl from './control.js'
import setupState from './state.js'
import setupEmit from './emit.js'
import setupOtxn from './otxn.js'
import setupSlot from './slot.js'
import setupUtil from './util.js'
import setupKeylets from './keylets.js'

export default (ctx) => {
  if (ctx.transform?.host !== 'hook') return
  setupApi(ctx)
  setupTrace(ctx)
  setupControl(ctx)
  setupState(ctx)
  setupEmit(ctx)
  setupOtxn(ctx)
  setupSlot(ctx)
  setupUtil(ctx)
  setupKeylets(ctx)
}
