pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credential')  
        IMAGE_NAME = 'ahmedlebshten/helloapp'         
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "📦 Cloning source code..."
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker image..."
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                script {
                    echo "🔑 Logging into Docker Hub..."
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                }
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                script {
                    echo "🚀 Pushing image to Docker Hub..."
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Clean Up') {
            steps {
                echo "🧹 Removing local images..."
                sh "docker rmi ${IMAGE_NAME}:latest || true"
            }
        }
    }

    post {
        success {
            echo "✅ Docker image built and pushed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Please check logs."
        }
    }
}
