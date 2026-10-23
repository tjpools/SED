@description('Azure region for the Static Web App.')
param location string

@description('Globally unique Static Web App name.')
param staticSiteName string

@description('Deployment metadata tags.')
param tags object

resource staticSite 'Microsoft.Web/staticSites@2024-11-01' = {
  name: staticSiteName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  tags: tags
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
    publicNetworkAccess: 'Enabled'
  }
}

output staticSiteName string = staticSite.name
output defaultHostname string = staticSite.properties.defaultHostname
