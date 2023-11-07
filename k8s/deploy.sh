#minikube start
# copy the model directory to minikube
IP=$(minikube ip)
SSH_KEY=$(minikube ssh-key)

# Obtain the ACR token
TOKEN=$(az acr login --name meuwbidsdevmlwcr --expose-token --output tsv --query accessToken)

# Log into Docker with the ACR token
docker login meuwbidsdevmlwcr.azurecr.io --username 00000000-0000-0000-0000-000000000000 --password $TOKEN

kubectl delete secret azure-regcred
# Create the Kubernetes secret
kubectl create secret docker-registry azure-regcred \
  --docker-server=meuwbidsdevmlwcr.azurecr.io \
  --docker-username=00000000-0000-0000-0000-000000000000 \
  --docker-password=$TOKEN


kubectl apply -f ./chatbot-ui.yaml
#kubectl apply -f k8s-ingress.yaml
sleep 10
kubectl get pods
