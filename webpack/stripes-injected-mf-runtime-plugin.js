
// This file can be used to attach lifecycle hooks to the module federation runtime logic.
// See https://module-federation.io/guide/runtime/runtime-hooks.html for possible entries.
import satisfies from 'semver/functions/satisfies';
import { HOST_RUNTIME_PLUGIN_NAME } from '../consts.js';

const StripesInjectedMFRuntimePlugin = () => ({
  name: HOST_RUNTIME_PLUGIN_NAME,
  // collect requests for shares that are different versions from the host app's provided versions for debugging purposes.
  // accessible in the console via the __DEBUG_MISSED_DEPS__ global variable.
  async beforeLoadShare(args) {
    if (!globalThis.__DEBUG_MISSED_DEPS__) {
      globalThis.__DEBUG_MISSED_DEPS__ = [];
    }

    // Only proceed if there is a host modfed instance, meaning modfed has initialized.
    // these can be viewed in the console with the __FEDERATION__.__INSTANCES__ global variable.
    const hostInstance = __FEDERATION__.__INSTANCES__?.[0];
    if (!hostInstance) {
      return args;
    }

    const { origin, shareInfo, pkgName } = args;

    // Only proceed if the host app provides a shared module of the same name.
    const hostShared = hostInstance.options.shared?.[pkgName]?.[0];

    if (!hostShared) {
      return args;
    }

    let hostVersion = hostShared.version;

    if (!satisfies(hostVersion, shareInfo.shareConfig.requiredVersion)) {
      if (globalThis.__DEBUG_MISSED_DEPS__.findIndex(s => s.pkgName === pkgName && s.remoteApp === origin.name) === -1) {
        globalThis.__DEBUG_MISSED_DEPS__.push({ pkgName, hostVersion: hostVersion, remoteApp: origin.name, ...shareInfo });
      }
    }

    return args;
  },
});

export default StripesInjectedMFRuntimePlugin;