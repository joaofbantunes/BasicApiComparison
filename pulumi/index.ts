import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as acr from "@pulumi/azure-native/containerregistry";
import * as app from "@pulumi/azure-native/app";
import * as docker from "@pulumi/docker";
import * as pg from "@pulumi/azure-native/dbforpostgresql";
import * as inputs from "@pulumi/azure-native/types/input";

const resourceGroup = new resources.ResourceGroup("basic-api-comparison");

// TODO: move password to somewhere else
const pgServerAdminPassword = "thisisaverysafepassword!0";
const pgServer = new pg.Server("pgserver", {
  resourceGroupName: resourceGroup.name,
  version: "15",
  administratorLogin: "postgres",
  administratorLoginPassword: pgServerAdminPassword,
  backup: {
    backupRetentionDays: 7,
  },
  // see az postgres flexible-server list-skus --location northeurope
  // see https://learn.microsoft.com/en-us/azure/templates/microsoft.dbforpostgresql/2022-12-01/flexibleservers#sku
  // see https://azure.microsoft.com/en-us/pricing/details/postgresql/flexible-server/
  sku: {
    tier: "Burstable",
    name: "Standard_B1ms",
  },
  storage: {
    storageSizeGB: 32,
  },
});

const pgInsideAzureFirewallRules = new pg.FirewallRule("all-inside-azure", {
  resourceGroupName: resourceGroup.name,
  serverName: pgServer.name,
  startIpAddress: "0.0.0.0",
  endIpAddress: "0.0.0.0",
});

const pgDb = new pg.Database("pgdb", {
  resourceGroupName: resourceGroup.name,
  serverName: pgServer.name,
  databaseName: "BasicApiComparison",
  charset: "UTF8",
  collation: "en_US.utf8",
});

const registry = new acr.Registry("basicapicomparison", {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: "Basic",
  },
  adminUserEnabled: true,
});

const registryCredentials = acr.listRegistryCredentialsOutput({
  resourceGroupName: resourceGroup.name,
  registryName: registry.name,
});

const registryAdminUsername = registryCredentials.apply((c) => c.username!);
const registryAdminPassword = registryCredentials.apply(
  (c) => c.passwords![0].value!
);

const env = new app.ManagedEnvironment("env", {
  resourceGroupName: resourceGroup.name,
  appLogsConfiguration: {}, // https://github.com/pulumi/pulumi-azure-native/issues/2578
});

// const [csharpAotImage, csharpAotApp] = createContainerImageAndApp(
//   "csharpaot",
//   "../dotnet/src/Api/Dockerfile.aot",
//   "../dotnet/src/Api/.",
//   createDotnetSecrets(),
//   createDotnetEnvVars("csharp-aot")
// );

// const [csharpImage, csharpApp] = createContainerImageAndApp(
//   "csharp",
//   "../dotnet/src/Api/Dockerfile.default",
//   "../dotnet/src/Api/.",
//   createDotnetSecrets(),
//   createDotnetEnvVars("csharp")
// );

// const csharpAotApp = createContainerAppFromExistingImage(
//   "csharpaot",
//   createDotnetSecrets(),
//   createDotnetEnvVars("csharp-aot")
// );

// const csharpApp = createContainerAppFromExistingImage(
//   "csharp",
//   createDotnetSecrets(),
//   createDotnetEnvVars("csharp")
// );

const [rustImage, rustApp] = createContainerImageAndApp(
  "rust",
  "../rust/Dockerfile",
  "../rust",
  createAppSecrets(),
  createAppEnvVars()
);

const [goImage, goApp] = createContainerImageAndApp(
  "go",
  "../go/Dockerfile",
  "../go",
  createAppSecrets(),
  createAppEnvVars()
);

const [pythonImage, pythonApp] = createContainerImageAndApp(
  "python",
  "../python/Dockerfile",
  "../python",
  createAppSecrets(),
  createAppEnvVars()
);

const [nodeRawImage, nodeRawApp] = createContainerImageAndApp(
  "noderaw",
  "../node/raw/Dockerfile",
  "../node/raw",
  createAppSecrets(),
  createAppEnvVars()
);

const [nodeExpressImage, nodeExpressApp] = createContainerImageAndApp(
  "nodeexpress",
  "../node/express/Dockerfile",
  "../node/express",
  createAppSecrets(),
  createAppEnvVars()
);

const [kotlinImage, kotlinApp] = createContainerImageAndApp(
  "kotlin",
  "../kotlin/Dockerfile",
  "../kotlin",
  createAppSecrets(),
  createAppEnvVars()
);

function createContainerImageAndApp(
  name: string,
  dockerfile: string,
  context: string,
  secrets: inputs.app.SecretArgs[],
  envVars: inputs.app.EnvironmentVarArgs[],
  dockerArgs?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>
): [docker.Image, app.ContainerApp] {
  const image = new docker.Image(
    name,
    {
      imageName: pulumi.interpolate`${registry.loginServer}/${name}:latest`,
      build: {
        context: context,
        dockerfile: dockerfile,
        platform: "linux/amd64",
        args: dockerArgs,
      },
      registry: {
        server: registry.loginServer,
        username: registryAdminUsername,
        password: registryAdminPassword,
      },
    },
    {
      dependsOn: [registry, pgDb],
    }
  );

  const containerApp = new app.ContainerApp(name, {
    resourceGroupName: resourceGroup.name,
    environmentId: env.id,
    configuration: {
      ingress: {
        external: true,
        targetPort: 8080,
      },
      registries: [
        {
          server: registry.loginServer,
          username: registryAdminUsername,
          passwordSecretRef: "pwd",
        },
      ],
      secrets: secrets.concat([
        {
          name: "pwd",
          value: registryAdminPassword,
        },
      ]),
    },
    template: {
      containers: [
        {
          name: name,
          image: image.imageName,
          env: envVars,
          /*
          Total CPU and memory for all containers defined in a Container App must add up to one of the following CPU - Memory combinations: 
          [cpu: 0.25, memory: 0.5Gi]; 
          [cpu: 0.5, memory: 1.0Gi]; 
          [cpu: 0.75, memory: 1.5Gi]; 
          [cpu: 1.0, memory: 2.0Gi]; 
          [cpu: 1.25, memory: 2.5Gi]; 
          [cpu: 1.5, memory: 3.0Gi]; 
          [cpu: 1.75, memory: 3.5Gi]; 
          [cpu: 2.0, memory: 4.0Gi]
          */
          resources: {
            cpu: 0.25,
            memory: "0.5Gi",
          },
        },
      ],
      scale: {
        minReplicas: 0,
        maxReplicas: 1,
      },
    },
  });

  return [image, containerApp];
}

function createContainerAppFromExistingImage(
  name: string,
  secrets: inputs.app.SecretArgs[],
  envVars: inputs.app.EnvironmentVarArgs[]
): app.ContainerApp {
  return new app.ContainerApp(name, {
    resourceGroupName: resourceGroup.name,
    environmentId: env.id,
    configuration: {
      ingress: {
        external: true,
        targetPort: 8080,
      },
      registries: [
        {
          server: registry.loginServer,
          username: registryAdminUsername,
          passwordSecretRef: "pwd",
        },
      ],
      secrets: secrets.concat([
        {
          name: "pwd",
          value: registryAdminPassword,
        },
      ]),
    },
    template: {
      containers: [
        {
          name: name,
          image: pulumi.interpolate`${registry.loginServer}/${name}:latest`,
          env: envVars,
          /*
                Total CPU and memory for all containers defined in a Container App must add up to one of the following CPU - Memory combinations: 
                [cpu: 0.25, memory: 0.5Gi]; 
                [cpu: 0.5, memory: 1.0Gi]; 
                [cpu: 0.75, memory: 1.5Gi]; 
                [cpu: 1.0, memory: 2.0Gi]; 
                [cpu: 1.25, memory: 2.5Gi]; 
                [cpu: 1.5, memory: 3.0Gi]; 
                [cpu: 1.75, memory: 3.5Gi]; 
                [cpu: 2.0, memory: 4.0Gi]
                */
          resources: {
            cpu: 0.25,
            memory: "0.5Gi",
          },
        },
      ],
      scale: {
        minReplicas: 0,
        maxReplicas: 1,
      },
    },
  });
}

function createDotnetSecrets(): inputs.app.SecretArgs[] {
  return [
    {
      name: "connection-string",
      value: pulumi.interpolate`server=${pgServer.fullyQualifiedDomainName};port=5432;user id=postgres;password=${pgServerAdminPassword};database=${pgDb.name};MaxPoolSize=25`,
    },
  ];
}

function createDotnetEnvVars(stack: string): inputs.app.EnvironmentVarArgs[] {
  return [
    {
      name: "ConnectionStrings__SqlConnectionString",
      secretRef: "connection-string",
    },
    {
      name: "Stack",
      value: stack,
    },
  ];
}

function createAppSecrets(): inputs.app.SecretArgs[] {
  return [
    {
      name: "db-password",
      value: pgServerAdminPassword,
    },
  ];
}

function createAppEnvVars(): inputs.app.EnvironmentVarArgs[] {
  return [
    {
      name: "DB_USER",
      value: "postgres",
    },
    {
      name: "DB_PASS",
      secretRef: "db-password",
    },
    {
      name: "DB_HOST",
      value: pgServer.fullyQualifiedDomainName,
    },
    {
      name: "DB_PORT",
      value: "5432",
    },
    {
      name: "DB_NAME",
      value: pgDb.name,
    },
    {
      name: "DB_USE_SSL",
      value: "true",
    },
  ];
}
