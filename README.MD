# AGILE POKER ([Demo](https://agile.junaid.guru))
![CI/CD](https://github.com/poly-glot/agile-poker/workflows/CI/CD/badge.svg)
[![codecov](https://codecov.io/gh/poly-glot/agile-poker/branch/main/graph/badge.svg)](https://codecov.io/gh/poly-glot/agile-poker)
[![This project is using Percy.io for visual regression testing.](https://percy.io/static/images/percy-badge.svg)](https://percy.io/328a6753/agile-poker)
[![Cypress.io Dashboard](https://img.shields.io/badge/cypress-dashboard-brightgreen.svg)](https://dashboard.cypress.io/projects/coqb3r/runs)
[![DeepScan grade](https://deepscan.io/api/teams/8408/projects/10623/branches/149386/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8408&pid=10623&bid=149386)
[![Maintainability](https://api.codeclimate.com/v1/badges/e9ab18c4667689e347de/maintainability)](https://codeclimate.com/github/poly-glot/agile-poker/maintainability)
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/poly-glot/agile-poker)

A serverless application built on Firebase Cloud to make agile team's story estimating efficient and fun.

# Getting Started
```
npm install
npm start
```

# Browser Support
2 most recent versions of Chrome, Firefox, Safari & MS Edge.

# Security Consideration
- Enabled [App Check](https://firebase.google.com/docs/app-check)
- Setup Monitoring on [Realtime Database](https://firebase.google.com/docs/database/usage/monitor-usage)
- Locked read & write access. Added Security Rules & Validation on firebase to test the protection on abusive behaviour.
- Make sure to set up max-instances on [Cloud functions](https://cloud.google.com/functions/docs/max-instances)

# Scalability Consideration
- Solution can handle up to 200k concurrent connections on [Firebase Blaze Plan](https://firebase.google.com/pricing)

# Legal Matters
- [Google faces lawsuit over tracking in apps even when users opted out](https://www.reuters.com/article/us-alphabet-google-privacy-lawsuit-idUSKCN24F2N4)
