const HostOverrideSharePlugin = () => {
  return {
    name: 'host-override-share-plugin',
    // beforeInit(args) {

    //   const { origin } = args;
    //   if (origin.name !== 'host') {
    //     console.log(`replacing shareInfo for ${origin.name} with host app shareScopeMap.`);
    //     const hostInstance = __FEDERATION__.__INSTANCES__[0];
    //     args.origin.shareScopeMap = hostInstance.shareScopeMap;
    //     args.shareInfo = hostInstance.options.shared;
    //     args.userOptions.shared = hostInstance.options.shared;
    //   }
    //   return args;
    // },
    // onload(args) {
    //   console.log('HostOverrideSharePlugin loaded with args:', args);
    //   return args;
    // },
    // resolveShare: args => {
    //   const { shareScopeMap, scope, pkgName, version, GlobalFederation } = args;

    //   console.log('resolveShare:', args);

    //   const host = GlobalFederation['__INSTANCES__'][0];
    //   if (!host) {
    //     return args;
    //   }

    //   if (!host.options.shared[pkgName]) {
    //     return args;
    //   }

    //   args.resolver = function () {
    //     args.shareScopeMap[scope][pkgName][version] =
    //       host.options.shared[pkgName][0];

    //     console.log('Replaced share resolution for', pkgName, 'with version', version, 'to host app shared version', host.options.shared[pkgName][0]);
    //     return {
    //       shared: args.shareScopeMap[scope][pkgName][version],
    //       useTreesShaking: false,
    //     };
    //   };

    //   return args;
    // },
    // async beforeLoadShare(args) {
    //   console.log('beforeLoadShare', args);
    //   return args;
    // },
    // beforeRegisterShare(args) {
    //   console.log('beforeRegisterShare', args);
    //   return args;
    // },
    // async afterResolve(args) {
    //   console.log('afterResolve', args);
    //   return args;
    // },
    // async loadShare(args) {
    //   console.log('loadShare:', args);
    //   return args;
    // },
    // async beforeLoadShare(args) {
    //   console.log('beforeloadShare:', args);
    //   return args;
    // },
    // initContainerShareScopeMap(args) {
    //   console.log('initContainerShareScopeMap:', args);
    //   return args;
    // }

  };
};

export default HostOverrideSharePlugin;