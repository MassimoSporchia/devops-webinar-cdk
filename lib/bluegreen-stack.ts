import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecr from "@aws-cdk/aws-ecr";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";

export class BluegreenStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "ecs-vpc", {
      cidr: "10.0.0.0/16",
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    const repo = ecr.Repository.fromRepositoryName(
      this,
      "repository",
      "webinar"
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef");

    const containerDefinition = taskDefinition.addContainer(
      "DefaultContainer",
      {
        image: ecs.ContainerImage.fromEcrRepository(repo, "latest"),
        memoryLimitMiB: 512,
        cpu: 1,
      }
    );

    containerDefinition.addPortMappings({
      containerPort: 8080,
      hostPort: 8080,
    });

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, "hello-world-service", {
      cluster,
      taskDefinition,
      deploymentController: { type: ecs.DeploymentControllerType.CODE_DEPLOY },
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
    });

    const blue_listener = lb.addListener("blue-listener", { port: 80 });

    const green_listener = lb.addListener("green-listener", {
      port: 8001,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    const blue_targetgroup = blue_listener.addTargets("hello-world-blue", {
      targetGroupName: "hello-world-blue",
      port: 80,
      healthCheck: {
        enabled: true,
        path: "/health",
        port: "80",
      },
      targets: [ecsService],
    });

    const green_targetgroup = green_listener.addTargets("hello-world-green", {
      targetGroupName: "hello-world-green",
      port: 8001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        enabled: true,
        path: "/health",
        port: "8001",
        protocol: elbv2.Protocol.HTTP,
      },
    });

  }
}
