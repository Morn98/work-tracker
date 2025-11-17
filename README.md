# Work Tracker

A modern, local-first time tracking application built with React, TypeScript, and Vite. Effortlessly track your work sessions by project, visualize productivity with charts, and manage your daily focus—all with data stored securely in your browser. No accounts, no servers: your data is always under your control.

---

## 🚀 Key Features

- **Timer & Manual Entry:** Start/pause/stop a timer for a selected project or add manual time entries.
- **Projects:** Organize your work by projects, each with customizable colors.
- **Dashboard:** At-a-glance view of today's and this week's totals, active projects, and recent activities.
- **Statistics:** Visualize tracked time using bar and pie charts by project and over time.
- **All Local:** Data is stored in your browser via LocalStorage. Export or clear your data at any time.
- **Responsive & Dark Mode:** Fully responsive UI with light/dark/theme options.

---

## 📁 Folder Structure

```
work-tracker/
├── public/                   # Static files
├── src/                      # Source code
│   ├── assets/               # Images and icons
│   ├── components/           # Reusable UI components
│   │   ├── charts/           # Chart components (Bar, Pie)
│   │   ├── sessions/         # Session (time entry) display components
│   │   ├── timer/            # Timer and ManualEntry components
│   │   └── ui/               # UI primitives (Button, Card, etc.)
│   ├── constants/            # Constant values (e.g., config, limits)
│   ├── contexts/             # React context (e.g., Theme context)
│   ├── hooks/                # Custom React hooks (e.g., useTimer, useProjects)
│   ├── lib/                  # Data storage logic (localStorage wrapper)
│   ├── pages/                # Application pages (Dashboard, Timer, etc.)
│   ├── types/                # TypeScript types/interfaces
│   └── utils/                # Utility/helper functions
├── dist/                     # Production build output (auto-generated)
├── index.html                # HTML entrypoint
├── package.json              # Project dependencies and scripts
└── vite.config.ts            # Vite configuration
```

---

## 🛠️ Technology Stack
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (fast dev/build)
- [Tailwind CSS 4](https://tailwindcss.com/) (utility-first styling)
- [React Router 7](https://reactrouter.com/)
- No backend, LocalStorage persistence

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/work-tracker.git
   cd work-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

---

## 🚀 Deploying to GitHub Pages

This project is ready for deployment via GitHub Pages using the `gh-pages` package. 

### Steps:

1. **Set your repository's correct GitHub username in `package.json`:**
   - The `homepage` field should be: `"https://YOUR-USERNAME.github.io/work-tracker"`
   - Replace `YOUR-USERNAME` with your actual GitHub username.

2. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deploy"
   git push origin main
   ```

3. **Install the gh-pages package (once):**
   ```bash
   npm install gh-pages --save-dev
   # or
   yarn add gh-pages --dev
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   # or
   yarn deploy
   ```
   This will build the app and publish the `dist/` directory to your `gh-pages` branch.

5. **Access your app at:**
   - `https://YOUR-USERNAME.github.io/work-tracker/`

**Notes:**
- All assets and routes are served relative to `/work-tracker/` to match GitHub Pages sub-path.
- After deploying, you can update your repository's GitHub settings to use the `gh-pages` branch as the source for Pages, if not set automatically.

---

## ▶️ Running the Project

### Development

Start the development server (with hot module reload):
```bash
npm run dev
# or
yarn dev
```

### Production

Create a production build:
```bash
npm run build
# or
yarn build
```

Preview the built app locally:
```bash
npm run preview
# or
yarn preview
```

---

## 🤝 How to Contribute

Contributions are welcome! To propose a new feature, bug fix, or improvement:

1. [Fork](https://github.com/YOUR-USERNAME/work-tracker/fork) the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes and push your branch
4. Open a Pull Request on GitHub

### Development Standards
- Use feature branches (not main) for PRs
- Write clear, concise commit messages
- Try to keep UI/UX consistent with dark/light support
- Add/update documentation as needed

---

## 🚧 Future Improvements

- **Cross-device sync** (optional, local only for now)
- **Pomodoro mode & focus features**
- **Tags/categories for sessions**
- **CSV/JSON export and import**
- **Customizable reports**
- **Notifications & reminders**

---

## 📄 License

MIT License

> **Note:** This project is fully client-side. All tracked data stays in your browser, giving you complete privacy and control.
