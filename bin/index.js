#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Helper to get the path of our CLI tool ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Helper function for prompts (No changes) ---
const promptForConfiguration = async () => {
  const questions = [
    {
      type: 'list',
      name: 'stateManagement',
      message: 'Select a state management library:',
      choices: ['Redux Toolkit', 'Zustand', 'None'],
      default: 'Redux Toolkit',
    },
    {
      type: 'list',
      name: 'uiLibrary',
      message: 'Select a UI library:',
      choices: ['Material UI', 'Tailwind CSS', 'None'],
      default: 'Material UI',
    },
    {
      type: 'confirm',
      name: 'useReactQuery',
      message: 'Do you want to include TanStack Query (React Query)?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'useDocker',
      message: 'Do you want to set up Docker?',
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers;
};

// --- Feature Function: Add Docker Support ---
const addDockerSupport = async (projectPath) => {
  const dockerSpinner = ora('Adding Docker files...').start();
  try {
    const dockerAssetPath = path.join(__dirname, '..', 'assets', 'docker');
    await fs.copy(path.join(dockerAssetPath, 'Dockerfile'), path.join(projectPath, 'Dockerfile'));
    await fs.copy(path.join(dockerAssetPath, '.dockerignore'), path.join(projectPath, '.dockerignore'));
    dockerSpinner.succeed(chalk.green('Docker support added successfully.'));
  } catch (error) {
    dockerSpinner.fail(chalk.red('Failed to add Docker support.'));
    console.error(error);
  }
};

// --- Feature Function: Add React Query Support ---
const addReactQuerySupport = async (projectPath) => {
  const querySpinner = ora('Integrating TanStack Query (React Query)...').start();
  try {
    // 1. Add dependency to package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.dependencies['@tanstack/react-query'] = '^5.51.1';
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // 2. Modify src/main.tsx to wrap App with QueryClientProvider
    // --- FIX IS HERE: Changed .jsx to .tsx ---
    const mainTsxPath = path.join(projectPath, 'src', 'main.tsx');
    let mainTsxContent = await fs.readFile(mainTsxPath, 'utf-8');

    // Add imports
    mainTsxContent = `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\n${mainTsxContent}`;
    
    // Create a client instance
    mainTsxContent = mainTsxContent.replace(
      "import App from './App.tsx';",
      "import App from './App.tsx';\n\nconst queryClient = new QueryClient();"
    );

    // Wrap the <App /> component
    mainTsxContent = mainTsxContent.replace(
      '<App />',
      '<QueryClientProvider client={queryClient}><App /></QueryClientProvider>'
    );

    await fs.writeFile(mainTsxPath, mainTsxContent, 'utf-8');

    querySpinner.succeed(chalk.green('TanStack Query integrated successfully.'));
  } catch (error) {
    querySpinner.fail(chalk.red('Failed to integrate TanStack Query.'));
    console.error(error);
  }
};


// --- Main Program Definition ---
const program = new Command();

program
  .name('create-ignite-kit')
  .description(chalk.cyan.bold('A CLI tool for generating production-ready React applications.'))
  .version('1.0.0');

// --- The 'create' command ---
program
  .command('create <project-name>')
  .description('Create a new React project with a specified name')
  .action(async (projectName) => {
    const projectPath = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      console.error(chalk.red(`\nError: Directory '${projectName}' already exists.`));
      process.exit(1);
    }
    
    console.log(chalk.green.bold(`\n🔥 Starting the setup for your new project: ${projectName}\n`));
    
    const options = await promptForConfiguration();

    console.log(chalk.blue.bold('\nYour selected configuration:'));
    console.log(chalk.blue(`- State Management: ${options.stateManagement}`));
    console.log(chalk.blue(`- UI Library:       ${options.uiLibrary}`));
    console.log(chalk.blue(`- React Query:      ${options.useReactQuery ? 'Yes' : 'No'}`));
    console.log(chalk.blue(`- Docker:           ${options.useDocker ? 'Yes' : 'No'}\n`));

    const copySpinner = ora(`Copying base template files to '${projectName}'...`).start();
    try {
      const templatePath = path.join(__dirname, '..', 'template');
      await fs.copy(templatePath, projectPath);
      copySpinner.succeed(chalk.green('Base files copied successfully.'));

      // --- Apply Configurations ---
      if (options.useDocker) {
        await addDockerSupport(projectPath);
      }
      if (options.useReactQuery) {
        await addReactQuerySupport(projectPath);
      }
      
      // --- Install Dependencies ---
      const installSpinner = ora('Installing dependencies... This might take a few minutes.').start();
      process.chdir(projectPath);
      await execa('npm', ['install']);
      installSpinner.succeed(chalk.green('Dependencies installed.'));

      // --- Success Message ---
      console.log(chalk.green.bold('\n🚀 Success! Your project is ready.'));
      console.log(chalk.cyan(`\nTo get started, run the following commands:\n`));
      console.log(chalk.white(`   cd ${projectName}`));
      console.log(chalk.white(`   make .env in your project bt refering .env.example\n`));
      console.log(chalk.white(`   npm run dev \n`));

    } catch (error) {
      copySpinner.fail(chalk.red('An error occurred during project setup.'));
      console.error(chalk.red(error.message));
      if (fs.existsSync(projectPath)) {
        fs.removeSync(projectPath);
      }
      process.exit(1);
    }
  });

// Parse the command-line arguments and execute the corresponding action
program.parse(process.argv);
