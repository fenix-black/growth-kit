# GrowthKit Example App - Public Key Mode

This is a comprehensive Next.js example showcasing **GrowthKit v0.5.1** with the new **Public Key Mode** - the simplest way to integrate GrowthKit into any application.

## ✨ Key Features

- 🚀 **Public Key Mode**: No backend required, works with static sites
- 🔒 **Secure**: Public keys are safe for client-side use  
- ⚡ **Simple Setup**: Just one configuration line
- 🌍 **Universal**: Works with any JavaScript environment
- 🎯 **Complete Demo**: All GrowthKit features in action

## 🏃‍♂️ Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get your Public Key:**
   - Go to your GrowthKit admin dashboard
   - Navigate to **API Tokens** tab in your app settings
   - Copy your **Public Key** (starts with `pk_`)

3. **Configure environment:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_GROWTHKIT_PUBLIC_KEY=pk_your_public_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   
   # Optional: Only set if using custom deployment
   # NEXT_PUBLIC_GROWTHKIT_API_URL=https://your-custom-domain.com/api
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001) to see the example in action!

## 🎯 What This Demo Shows

### **Public Key Integration**
```tsx
const config = {
  publicKey: process.env.NEXT_PUBLIC_GROWTHKIT_PUBLIC_KEY!,
  // Optional: apiUrl defaults to https://growth.fenixblack.ai/api
  apiUrl: process.env.NEXT_PUBLIC_GROWTHKIT_API_URL || 'https://growth.fenixblack.ai/api',
  debug: true,
  language: 'en',
  theme: 'auto',
};
```
**That's it!** No middleware, no server setup, no complex configuration.

### **Featured Components**

1. **🎯 GrowthKitAccountWidget**
   - Displays credits balance
   - Profile management (name, email, verification)
   - Earn credits modal with referral sharing
   - Multi-language support (English/Spanish)
   - Theme switching (light/dark/auto)

2. **📊 Activity Tracking**
   - Automatic page view tracking
   - Session tracking with duration
   - Scroll behavior monitoring
   - Custom event tracking
   - Event batching demonstration

3. **💰 Credit System**
   - Credit consumption for features
   - USD value tracking for admin analytics
   - Different action costs demonstration
   - Real-time balance updates

4. **🎁 Referral System**
   - Automatic referral code generation
   - Social sharing integration
   - Credit rewards for referrals
   - Real-time referral tracking

## 🛠 SDK Features Demonstrated

### **Core Functionality**
- ✅ **Token Management**: Automatic JWT token handling
- ✅ **User State**: Real-time credit and profile updates  
- ✅ **Activity Tracking**: Comprehensive event system
- ✅ **Credit Economy**: Flexible credit consumption
- ✅ **Referral System**: Complete viral growth features
- ✅ **Localization**: English and Spanish support
- ✅ **Theming**: Light, dark, and auto modes

### **Technical Features**
- ✅ **Client-Side Only**: No backend infrastructure needed
- ✅ **Secure Authentication**: Public key + JWT tokens
- ✅ **Rate Limiting**: Built-in abuse protection
- ✅ **Error Handling**: Graceful degradation
- ✅ **Debug Mode**: Comprehensive logging
- ✅ **TypeScript**: Full type safety

## 🎮 Interactive Features

### **Try These Actions:**
1. **Use Feature** - Consumes 1 credit
2. **USD Tracking** - Test different cost tiers
3. **Activity Tracking** - Various event demonstrations
4. **Language Toggle** - Switch between English/Spanish
5. **Theme Toggle** - Cycle through light/dark/auto
6. **Earn Credits** - Open modal to share and earn

### **Behind the Scenes:**
- 🔄 **Automatic token refresh** every 30 minutes
- 📊 **Event batching** for performance
- 🎯 **Fingerprint tracking** for user identity
- 🔒 **Origin validation** for security
- ⚡ **Rate limiting** for abuse prevention

## 🚀 Migration from v0.4.x

If you're upgrading from middleware mode:

**Before (Middleware Required):**
```tsx
// Required middleware.ts + environment setup
const config = {
  // No config needed - used middleware proxy
};
```

**After (Public Key Mode):**
```tsx
// Just add your public key!
const config = {
  publicKey: 'pk_your_key_here'
};
```

## 🔗 Learn More

- **📚 Migration Guide**: See `PUBLIC_KEY_MIGRATION_GUIDE.md` in the root
- **📖 Full Documentation**: Check the SDK README
- **🎯 Admin Dashboard**: Get your public key from API Tokens tab
- **🆘 Support**: Check browser console with `debug: true` enabled

## 🎉 What's New in v0.5.1

- ✨ **Universal Links**: Referrals, invitations, and verification all use query parameters
- 🌍 **No Middleware Needed**: All flows work with static sites and SPAs
- 🔧 **Fixed Processing**: Proper endpoints for referrals vs invitations vs verification
- ⚡ **Auto URL Cleanup**: Widget removes processed parameters automatically
- 📱 **Enhanced Debug**: Better logging for all parameter processing

### Previous v0.5.0 Features:
- ✨ **Public Key Mode**: Client-side only integration
- 🔒 **Enhanced Security**: Safe public keys + JWT tokens
- ⚡ **Better Performance**: Direct API calls
- 📱 **Improved DX**: 10-second setup vs 30+ minutes