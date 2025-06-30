# Lovable Development Assistant

A comprehensive Chrome extension built with WXT and React that provides developers with essential tools for feature tracking, testing, documentation generation, and expert hiring - all accessible from your browser's sidebar.

## ✨ Features

### 🎯 Feature List
- **Smart Task Management**: Create, track, and organize development features
- **Priority System**: Urgent, High, Medium, Low priority levels with color coding
- **Status Tracking**: Todo, In Progress, Completed with visual indicators
- **Notes System**: Add multiple notes per feature with timestamps
- **Advanced Filtering**: Filter by status, priority, and sort options
- **Statistics Dashboard**: Real-time progress tracking

### 🧪 Test Cases
- **Test Case Creation**: Define test scenarios with multiple steps
- **Execution Tracking**: Mark tests as Pass/Fail with detailed results
- **Test Statistics**: Track pass rates and execution history
- **Step Management**: Add, edit, and organize test steps

### 📚 Document Generation
- **AI-Powered**: Integration with Google Gemini API for intelligent documentation
- **Page Content Capture**: Automatically read and analyze current webpage content
- **One-Click Generation**: Generate comprehensive documentation instantly
- **Export Options**: Download generated documents in various formats

### 👥 Expert Hiring Hub
- **Expert Directory**: Browse and search through expert profiles
- **Smart Filtering**: Filter by skills, experience level, and hourly rates
- **Contact System**: Direct messaging and project inquiry forms
- **Profile Management**: Detailed expert profiles with ratings and portfolios

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Chrome browser

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lovable-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Load extension manually in Chrome**
   
   Since the extension is configured not to auto-open Chrome (to use your existing instance):
   
   a. Open Chrome and navigate to `chrome://extensions/`
   
   b. Enable "Developer mode" (toggle in the top right)
   
   c. Click "Load unpacked" 
   
   d. Select the `.output/chrome-mv3-dev` folder (created after running `npm run dev`)
   
   e. The extension will appear in your toolbar

5. **Access the sidebar**
   - Click the Lovable Development Assistant icon in your Chrome toolbar
   - The sidebar will open with all four main features

### For Production Build

```bash
npm run build
# or
yarn build
```

Load the `.output/chrome-mv3` folder in Chrome for the production version.

## 🎨 Design Features

The extension features a modern, professional design with:
- **Gradient backgrounds** and smooth animations
- **Card-based layouts** with hover effects
- **Color-coded priority and status** indicators
- **Responsive design** optimized for sidebar use
- **Consistent typography** and spacing
- **Interactive elements** with smooth transitions

## 🔧 Configuration

### Gemini API Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key in the Document Generation section
3. Start generating AI-powered documentation

### Customization
- Modify styles in `/entrypoints/sidepanel/style.css`
- Update component styles in individual component files
- Customize colors and themes in the main `SidebarApp.tsx`

## 🗂️ Project Structure

```
lovable-extension/
├── components/           # React components
│   ├── SidebarApp.tsx   # Main sidebar application
│   ├── FeatureList.tsx  # Feature tracking component
│   ├── TestCases.tsx    # Test case management
│   ├── DocumentGeneration.tsx # AI documentation
│   └── ExpertHub.tsx    # Expert hiring platform
├── entrypoints/         # Extension entry points
│   ├── background.ts    # Background script
│   ├── content.ts       # Content script
│   ├── popup/          # Extension popup
│   └── sidepanel/      # Sidebar interface
├── public/             # Static assets
├── package.json        # Dependencies
├── wxt.config.ts      # WXT configuration
└── README.md          # This file
```

## 🛠️ Development

### Adding New Features
1. Create new components in `/components/`
2. Import and integrate in `SidebarApp.tsx`
3. Add navigation tab and icon
4. Test in development mode

### Styling Guidelines
- Use Tailwind CSS classes for consistency
- Follow the gradient and modern design patterns
- Maintain responsive design principles
- Use consistent spacing and colors

## 📦 Technologies Used

- **WXT**: Modern web extension development framework
- **React 18**: UI library with hooks and modern patterns
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Chrome Extensions API**: Browser integration
- **Google Gemini API**: AI documentation generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the Chrome Developer Console for errors
2. Ensure all dependencies are installed correctly
3. Verify Chrome extension permissions are granted
4. Check that the Gemini API key is properly configured

## 🚀 Roadmap

- [ ] Cloud synchronization for data persistence
- [ ] Team collaboration features
- [ ] Advanced AI integrations
- [ ] Mobile companion app
- [ ] Integration with popular development tools

---

**Made with ❤️ for developers by developers**
