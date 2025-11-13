# GitHub Actions Deployment Setup

This repository uses GitHub Actions to automatically build and deploy the website to GitHub Pages.

## How It Works

The deployment workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers** on every push to the `new-website` branch
2. **Builds** the SvelteKit static site using `npm run build`
3. **Copies** the `build/` directory to `docs/` directory
4. **Creates** a `.nojekyll` file to bypass Jekyll processing
5. **Commits** the changes back to the repository
6. **Pushes** the updated `docs/` directory to GitHub

## Repository Settings Configuration

To enable GitHub Pages deployment, configure the following settings in your repository:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - **Deploy from a branch**
4. Under **Branch**, select:
   - Branch: `new-website` (or your main branch)
   - Folder: `/docs`
5. Click **Save**

### 2. Workflow Permissions

The workflow requires write permissions to commit and push changes:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests** (optional)
5. Click **Save**

## Manual Deployment

You can also trigger the deployment manually:

1. Go to the **Actions** tab in your repository
2. Click on **Build and Deploy to GitHub Pages**
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Local Deployment (Alternative)

If you prefer to deploy manually from your local machine, you can still use:

```bash
make github
```

This will build the site and push the `docs/` directory to GitHub.

## Deployment URL

Once configured, your site will be available at:

```
https://<username>.github.io/<repository-name>/
```

For example:
- `https://yourusername.github.io/www/`

## Troubleshooting

### Deployment fails with permission errors

- Ensure **Workflow permissions** are set to **Read and write**
- Check that the branch name in the workflow matches your repository's default branch

### Site shows 404

- Verify that GitHub Pages source is set to the `docs/` folder
- Check that the `.nojekyll` file exists in the `docs/` directory
- Ensure the `docs/` directory is committed and pushed to the repository

### Build fails

- Check the **Actions** tab for detailed error logs
- Ensure all dependencies are correctly specified in `package.json`
- Verify Node.js version compatibility (requires Node >= 18.12.0)

### Changes not appearing

- GitHub Pages may take a few minutes to update after deployment
- Try hard-refreshing your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check the **Actions** tab to ensure the workflow completed successfully

## Workflow File Location

The workflow configuration is located at:
```
.github/workflows/deploy.yml
```

You can modify this file to:
- Change the trigger branch
- Add additional build steps
- Modify deployment behavior
- Add environment-specific configurations

## Environment Variables

If your build requires environment variables:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your secrets (e.g., `API_KEY`, `GOOGLE_DOCS_ID`)
4. Reference them in the workflow using `${{ secrets.SECRET_NAME }}`

Example:
```yaml
- name: Build static site
  run: npm run build
  env:
    GOOGLE_DOCS_ID: ${{ secrets.GOOGLE_DOCS_ID }}
```

## Disabling Automatic Deployment

If you want to disable automatic deployment:

1. Go to the **Actions** tab
2. Click on **Build and Deploy to GitHub Pages**
3. Click the **⋮** menu and select **Disable workflow**

Or delete the workflow file:
```bash
rm .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "disable automatic deployment"
git push
```
