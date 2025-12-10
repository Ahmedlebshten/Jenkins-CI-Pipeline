pipeline {
  agent any

  environment {
    DOCKERHUB_REPO = "ahmedlebshten/url-shortener"
    CD_REPO        = "https://github.com/Ahmedlebshten/ArgoCD-Pipeline.git"
    DEPLOY_FILE    = "ArgoCD-Application/deployment.yaml"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Clone CD repo & prepare tag') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'git-cred',
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_PASS'
          )
        ]) {
          script {
            sh '''
              set -e
              rm -rf cd-repo
              git clone https://${GIT_USER}:${GIT_PASS}@github.com/Ahmedlebshten/ArgoCD-Pipeline.git cd-repo
            '''

            def line = sh(
              script: "cd cd-repo && grep 'image: ${DOCKERHUB_REPO}:' ${DEPLOY_FILE} | head -1",
              returnStdout: true
            ).trim()

            if (!line) {
              error "Could not find image line in ${DEPLOY_FILE}"
            }

            def currentTag = line.tokenize(':')[-1] as int
            env.IMAGE_TAG = (currentTag + 1).toString()

            echo "Current tag: ${currentTag}, new tag: ${env.IMAGE_TAG}"
          }
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build -t ${DOCKERHUB_REPO}:${IMAGE_TAG} ."
      }
    }

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
            cd cd-repo

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
