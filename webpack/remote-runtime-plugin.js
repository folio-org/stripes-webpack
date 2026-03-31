// Remote containers include runtime plugins from their own build configuration, but not those of the host.
// In order for the remote's runtime plugins to be updated without a rebuild,
// we need to apply the host's plugins to the remote's container.
// This plugin sets a lifecycle method Before initialization of the remote's ModuleFederation instance
// to pass the host's runtime plugins to the remote container.
// The name of the plugin needs to match here, so we import it from a constant.
import { HOST_RUNTIME_PLUGIN_NAME } from "../consts.js";

const RemoteRuntimePlugin = () => ({
  name: 'remote-runtime-plugin',
  beforeInit(args) {

    // get override plugin from host instance...
    const hostInstance = __FEDERATION__.__INSTANCES__[0];
    if (!hostInstance) {
      return args;
    }
    const hostInjectedPlugin = hostInstance.options.plugins.find(plugin => plugin.name === HOST_RUNTIME_PLUGIN_NAME);
    if (!hostInjectedPlugin) {
      return args;
    }

    // injects it into new instance at runtime.
    const { origin } = args;
    origin.registerPlugins([hostInjectedPlugin]);

    return args;
  },
});

export default RemoteRuntimePlugin;