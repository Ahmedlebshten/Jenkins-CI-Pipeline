# DEPI-Final-Project
## 📊 Monitoring a Containerized URL Shortener Webservice

## 🧩 Overview

This project implements a **URL Shortener Webservice** that can shorten long URLs, store them in a database, and monitor its performance using **Docker**, **Prometheus**, and **Grafana**.

It focuses on building a production-ready, containerized system that supports real-time monitoring, alerting, and data visualization.

---

## 🎯 Objectives

- Build and deploy a **RESTful URL Shortener** application.
- **Containerize** all components for scalability and portability.
- Expose **custom Prometheus metrics** (requests, latency, errors).
- Use **Grafana** for real-time dashboard visualization.
- Enable **persistent storage** for database and monitoring data.
- Implement **alerting rules** to detect performance degradation.
- Automate the build and publish process via a Continuous Integration (CI) Pipeline using Jenkins.

---

## ⚙️ Architecture Overview

### **Database Design**

The application uses a relational schema to manage shortened URLs and track analytics:

#### **urls**
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| short_code | varchar(10) | Unique short code for the URL |
| original_url | text | The original long URL |
| created_at | timestamp | URL creation time |
| access_count | integer | Number of times accessed |
| last_accessed_at | timestamp | Last access timestamp |

#### **url_analytics**
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| url_id | integer | Foreign key (references `urls.id`) |
| accessed_at | timestamp | When the URL was accessed |
| user_agent | text | Browser or device info |
| ip_address | varchar(45) | Requester’s IP |
| referer | text | Source of the access |

**Relationship:**  
`urls (1) ---- (*) url_analytics`

---

## 🛠️ CI Pipeline: Automated Deployment
This component defines a Continuous Integration (CI) pipeline using Jenkins, Docker, and GitHub to automate the process of building and pushing the URL Shortener's Docker image.

Pipeline Features:

- Auto checkout from the specified GitHub repository and branch.
- Builds the Docker image for the URL Shortener Webservice.
- Pushes the built image to Docker Hub using secure credentials.
- Cleans up local Docker images to conserve space.
- Uses Jenkins credentials securely for sensitive information (e.g., Docker Hub login).

Quick Start for CI:

- Configure the Jenkins job (typically a Pipeline type) with your GitHub repository URL and target branch.
- Add your Docker Hub credentials (Username and Token/Password) in Jenkins as a secret credential.
- Run the pipeline manually or trigger it automatically via a GitHub Webhook on every push.
- Check the Jenkins console output for a successful build and image push.

The final built image can be run via:
```
docker run -p 8080:80 [YOUR_DOCKERHUB_USERNAME]/[YOUR_IMAGE_NAME]:latest
```

---

## 🧱 Tech Stack

| Component | Technology | Purpose |
|------------|-------------|----------|
| **Web Framework** | Node.js | Build REST API for shortening URLs |
| **Database** | SQLite | Store URL mappings |
| **Containerization** | Docker | Package and deploy the service |
| **Orchestration** | Docker Compose | Manage multiple containers |
| **Monitoring** | Prometheus | Collect application metrics |
| **Visualization** | Grafana | Display performance dashboards |
| **Version Control** | Git & GitHub | Source code and version management |
| **CI/CD**	| Jenkins | Automate build, test, and image push |
| **Documentation** | Markdown | Project documentation |

---

## 👥 Stakeholder Analysis

| Stakeholder | Role | Interest / Expectations | Power | Engagement Strategy |
|--------------|------|-------------------------|--------|----------------------|
| **Developer** | Developer, DevOps Engineer | Build, containerize, and monitor the service | High | Responsible for implementation and documentation |
| **Instructor** | Evaluator and Guide | Functional, well-documented DevOps project | High | Regular updates and demos |
| **End Users** | Testers | Simple and fast API, visible metrics | Medium | Provide access and usage instructions |
| **Prometheus & Grafana** | Tools | Proper metric collection and visualization | Medium | Continuous integration and validation |
| **SQLite Database** | Data Storage | Persistent and reliable data | Medium | Use Docker volumes for persistence |
| **Docker Platform** | Orchestrator | Stable multi-container setup | High | Maintain modular configuration |
| **Jenkins** | CI/CD System | Reliable, automated pipeline execution | High | Maintain robust Jenkinsfile

---

## 📈 Expected Outcomes

- Functional **URL Shortener Webservice** with monitoring.
- **Grafana Dashboards** displaying real-time metrics.
- **Alerting System** for anomalies (e.g., high latency).
- **Data persistence** across restarts.
- **Comprehensive documentation** for deployment and usage.

---
