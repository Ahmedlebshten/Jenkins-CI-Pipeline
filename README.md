# Jenkins CI Pipeline - HelloApp

A simple **CI pipeline** using **Jenkins**, **Docker**, and **GitHub** to automate building and pushing a Docker image.

---

## Features

- Auto **checkout** from GitHub.
- **Builds Docker image** for HelloApp.
- **Pushes image** to Docker Hub.
- Cleans up local Docker images.
- Uses Jenkins **credentials securely**.

---

## Quick Start

1. Configure Jenkins job with your GitHub repo and branch.  
2. Add Docker Hub credentials in Jenkins.  
3. Run the pipeline or trigger via GitHub push.  
4. Check the console output for Success.

```bash
docker run -p 8080:80 ahmedlebshten/helloapp:latest
