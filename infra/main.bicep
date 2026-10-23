targetScope = 'subscription'

@description('Deployment environment name.')
param environmentName string

@description('Azure region for the resource group and Static Web App.')
param location string

@description('Unique orchestration session identifier.')
param sessionId string

@description('Display name of the deployment initiator.')
param deployedBy string

@description('ISO 8601 timestamp for the deployment.')
param createdAt string

@description('Object ID of the signed-in deployment principal. Reserved for future role assignments.')
param deployerObjectId string

var resourceGroupName = 'rg-sed-sandbox-dev-629a'
var staticSiteName = 'swa-sed-sandbox-dev-629a'

var tags = {
  'app-onboard-skill': 'true'
  'app-onboard-session-id': sessionId
  'created-at': createdAt
  environment: environmentName
  'deployed-by': deployedBy
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module staticSite 'modules/static-web-app.bicep' = {
  name: 'static-web-app'
  scope: resourceGroup
  params: {
    location: location
    staticSiteName: staticSiteName
    tags: tags
  }
}

output resourceGroupName string = resourceGroup.name
output staticSiteName string = staticSite.outputs.staticSiteName
output defaultHostname string = staticSite.outputs.defaultHostname
