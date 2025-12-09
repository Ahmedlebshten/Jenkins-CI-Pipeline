pipeline {
  agent any

  environment {
    DOCKERHUB_REPO = "ahmedlebshten/url-shortener"
    IMAGE_TAG      = "${env.BUILD_NUMBER}"
    CD_REPO        = "https://github.com/Ahmedlebshten/ArgoCD-Pipeline.git"
    CD_REPO_PATH   = "."
    DEPLOY_FILE    = "ArgoCD-Application/deployment.yaml"
  }

  stages {

    stage('Security Scanning') {
      steps {
        script {
          def secBuild = build job: 'Security-Scanning', 
              parameters: [string(name: 'IMAGE_TAG', value: "${IMAGE_TAG}")],
              wait: true, 
              propagate: true
          echo "Security-Scanning build #${secBuild.number} finished with result: ${secBuild.result}"
    }
  }
}


    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build -t ${DOCKERHUB_REPO}:${IMAGE_TAG} ."
      }
    }

    stage('Docker Login') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DH_USER',
            passwordVariable: 'DH_PASS'
          )
        ]) {
          sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
        }
      }
    }

    stage('Push Docker Image') {
      steps {
        sh "docker push ${DOCKERHUB_REPO}:${IMAGE_TAG}"
      }
    }

    stage('Update CD repo (bump image tag)') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'git-cred',
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_PASS'
          )
        ]) {
          sh '''
            set -e
            rm -rf cd-repo

            git clone https://${GIT_USER}:${GIT_PASS}@github.com/Ahmedlebshten/ArgoCD-Pipeline.git cd-repo
            cd cd-repo || exit 2

            cd "${CD_REPO_PATH}" || (echo "Path ${CD_REPO_PATH} not found" && exit 3)

            if [ ! -f "${DEPLOY_FILE}" ]; then
              echo "ERROR: ${DEPLOY_FILE} not found under ${CD_REPO_PATH}"
              exit 4
            fi

            sed -i "s|image: ${DOCKERHUB_REPO}:.*|image: ${DOCKERHUB_REPO}:${IMAGE_TAG}|g" "${DEPLOY_FILE}"

            git --no-pager diff -- "${DEPLOY_FILE}" || true

            git config user.email "jenkins@ci.local"
            git config user.name "jenkins"

            if git diff --quiet; then
              echo "No changes in ${DEPLOY_FILE}"
            else
              git add "${DEPLOY_FILE}"
              git commit -m "ci: bump image to ${IMAGE_TAG}"
              git push origin HEAD
            fi
          '''
        }
      }
    }
  }

  post {
    success { echo "Done: ${DOCKERHUB_REPO}:${IMAGE_TAG}" }
    failure { echo "Failed" }
  }
}
