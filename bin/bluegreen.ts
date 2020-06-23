#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BluegreenStack } from '../lib/bluegreen-stack';

const app = new cdk.App();
new BluegreenStack(app, 'BluegreenStack');
