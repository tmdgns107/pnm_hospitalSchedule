# AWS Lambda based Pet Hospital Data Update
This project is an AWS Lambda function that fetches hospital data from a public API, transforms the data, and then updates a MySQL database. The function is implemented using TypeScript, and the project includes a Github workflow for deployment. This project runs as a CronJob in AWS CloudWatch.

Table of Contents
- Installation
- Usage
- Environment Variables
- CI/CD


1. Installation
Clone the repository and install the dependencies:
```
git clone https://github.com/tmdgns107/pnm_hospitalSchedule.git
cd pnm_hospitalSchedule
npm install
```

2. Usage
This is an AWS Lambda function and as such does not run on its own. It's meant to be deployed to AWS Lambda and run in response to event triggers.

Main handler function is located in index.ts file.

The function fetches data from a public API, filters and transforms the data, and then inserts the updated data into a MySQL database.

3. Environment Variables
This project requires certain environment variables to be set in the AWS Lambda environment configuration. Please ensure the following variables are properly set:
```
DEV_DB_HOST=
DEV_DB_USER=
DEV_DB_PASSWORD=
DEV_DB_NAME=
PROD_DB_HOST=
PROD_DB_USER=
PROD_DB_PASSWORD=
PROD_DB_NAME=
PUBLIC_API_KEY=
SHA256_SALT=
```
These environment variables include the database connection details for both development and production environments, a public API key to access the required public data, and a salt for SHA-256 hashing.

4. Deployment
Deployment is managed via GitHub Actions, configured in .github/workflows/main.yml.

When changes are pushed to the main branch, the workflow is triggered to build the project, create a ZIP file of the build, and then update the AWS Lambda function code using AWS CLI.

5. CI/CD
Continuous Integration and Deployment is set up using GitHub Actions. The workflow is defined in .github/workflows/main.yml.

The workflow runs on every push to the main branch. It sets up Node.js, configures AWS credentials, installs npm dependencies, builds the TypeScript code, creates a ZIP file of the build, and then deploys the function to AWS Lambda using AWS CLI.


