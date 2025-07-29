# VLEI Demo - Interactive Web Interface

This is a beautiful, interactive web demo showcasing the VLEI (Verifiable Legal Entity Identifier) system functionality.

## 🚀 Quick Start

1. **Open the demo**: Simply open `demo.html` in any modern web browser
2. **No setup required**: All dependencies are loaded from CDNs
3. **Works offline**: Once loaded, the demo works completely in your browser

## 🎯 Features Demonstrated

### Step 1: Key Generation
- Generate cryptographic key pairs for VLEI issuer, legal entity, and representative
- Each participant gets a unique DID (Decentralized Identifier)
- Keys are generated using industry-standard Ethereum cryptography

### Step 2: Credential Creation
- Create verifiable credentials establishing roles within legal entities
- Supports various roles: CTO, CEO, CFO, COO, Director, Manager
- Generates JWT-formatted credentials following W3C standards

### Step 3: Verification
- **Credential Validation**: Verify the structure and content of credentials
- **Role Verification**: Confirm specific roles for representatives
- **Signature Verification**: Cryptographically verify credential signatures

## 🎨 UI Features

- **Modern Design**: Beautiful gradient backgrounds and smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Step-by-Step Flow**: Guided process with visual progress indicators
- **Real-time Feedback**: Success/error notifications and loading states
- **Interactive Elements**: Hover effects and smooth transitions

## 🔧 Technical Details

### Dependencies (Loaded from CDNs)
- **Tailwind CSS**: For styling and responsive design
- **Ethers.js**: For cryptographic operations and DID generation
- **Jose**: For JWT creation and verification
- **Font Awesome**: For icons and visual elements

### Browser Compatibility
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 📱 Usage Instructions

1. **Generate Keys**: Click "Generate Keys" to create cryptographic identities
2. **Create Credential**: Fill in the details and create a vLEI credential
3. **Verify Claims**: Test different verification methods

## 🎯 Example Use Case

The demo walks through creating a scenario where:
- **VLEI Authority** (issuer) creates a credential
- **Acme Corp** (legal entity) is the organization
- **Jane Doe** (representative) is verified as CTO of Acme Corp

## 🔒 Security Features

- **Cryptographic Signatures**: All credentials are cryptographically signed
- **DID-based Identity**: Uses Decentralized Identifiers for identity management
- **JWT Standards**: Follows industry-standard JWT format
- **Verification Methods**: Multiple verification approaches for different use cases

## 🌐 Deployment

This demo is perfect for:
- **GitHub Pages**: Simply push the HTML file to a GitHub repository
- **Static Hosting**: Works on any static file hosting service
- **Local Development**: Run locally for testing and development

## 📊 Demo Flow

```
Generate Keys → Create Credential → Verify Claims
     ↓              ↓                ↓
  DIDs & Keys   JWT Token      Validation Results
```

## 🎨 Customization

The demo is easily customizable:
- **Colors**: Modify the CSS variables and Tailwind classes
- **Roles**: Add or modify the available roles in the dropdown
- **Validation**: Extend the verification methods
- **Styling**: Adjust the visual design to match your brand

## 🔗 Related Files

- `index.ts`: Core VLEI system implementation
- `vlei.test.ts`: Comprehensive test suite
- `example.ts`: Command-line demo
- `demo.html`: Interactive web demo (this file)

## 🚀 Next Steps

After exploring the demo, you can:
1. **Integrate**: Use the core VLEI functions in your applications
2. **Extend**: Add more verification methods or credential types
3. **Deploy**: Host the demo on GitHub Pages or similar services
4. **Customize**: Modify the UI to match your specific use cases

---

*This demo showcases a production-ready VLEI system with beautiful, interactive UI for demonstrating verifiable credentials and digital identity management.* 