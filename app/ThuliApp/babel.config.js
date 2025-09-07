module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '../../secrets.env',
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
    // Temporarily disable reanimated plugin for hackathon development
    // 'react-native-reanimated/plugin', // Must be listed last!
  ],
};
