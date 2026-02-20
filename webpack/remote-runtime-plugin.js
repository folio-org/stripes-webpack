// Remote containers include runtime plugins from their own build configuration, but not those of the host.
// In order for the remote's runtime plugins to be updated without a rebuild,
// we need to apply the host's plugins to the remote's container.
// This plugin sets a lifecycle method Before initialization of the remote's ModuleFederation instance
// to pass the host's runtime plugins to the remote container.

const RemoteRuntimePlugin = () => ({
  name: 'remote-runtime-plugin',
  beforeInit(args) {
    console.log('BeforeInit Remote', args);

    // const { origin } = args;
    // if (origin.name !== 'host') {
    //   console.log(`replacing shareInfo for ${origin.name} with host app shareScopeMap.`);
    //   const hostInstance = __FEDERATION__.__INSTANCES__[0];
    //   args.origin.shareScopeMap = hostInstance.shareScopeMap;
    //   args.shareInfo = hostInstance.options.shared;
    //   args.userOptions.shared = hostInstance.options.shared;
    // }
    return args;
  },
});
