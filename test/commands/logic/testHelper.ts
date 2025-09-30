/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import path from 'node:path';
import fs from 'node:fs';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';

/**
 * Helper method to add flow and flow test to the project.
 * Also updates the sourceApiVersion to 65.0
 */
export async function setupUnifiedFrameworkProject(): Promise<TestSession> {
  // eslint-disable-next-line no-param-reassign
  const session = await TestSession.create({
    project: {
      gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
    },
    devhubAuthStrategy: 'AUTO',
    scratchOrgs: [
      {
        config: path.resolve('test', 'nuts', 'unifiedFrameworkProject', 'config', 'project-scratch-def.json'),
        setDefault: true,
        alias: 'org',
      },
    ],
  });
  const flowXml = path.join('test', 'nuts', 'unifiedFrameworkProject', 'force-app', 'main', 'default', 'flows', 'Populate_opp_description.flow-meta.xml');
  const flowsDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'flows');
  const targetFile = path.join(flowsDir, 'Populate_opp_description.flow-meta.xml');
  
  if (!fs.existsSync(flowsDir)) {
    fs.mkdirSync(flowsDir, { recursive: true });
  }
  
  fs.copyFileSync(flowXml, targetFile);
  
  const flowTestXml = path.join('test', 'nuts', 'unifiedFrameworkProject', 'force-app', 'main', 'default', 'flowtests', 'test_opportunity_updates.flowtest-meta.xml');
  const flowTestsDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'flowtests');
  const targetTestFile = path.join(flowTestsDir, 'test_opportunity_updates.flowtest-meta.xml');
  
  if (!fs.existsSync(flowTestsDir)) {
    fs.mkdirSync(flowTestsDir, { recursive: true });
  }
  
  fs.copyFileSync(flowTestXml, targetTestFile);
  
  const sfdxProjectPath = path.join(session.project.dir, 'sfdx-project.json');
  
  // We need to update the sourceApiVersion to 65.0 because the changes in the api are not supported in 64.0
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const sfdxProject = JSON.parse(fs.readFileSync(sfdxProjectPath, 'utf8'));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  sfdxProject.sourceApiVersion = parseInt(sfdxProject.sourceApiVersion, 10) < 65 ? '65.0' : sfdxProject.sourceApiVersion;
  fs.writeFileSync(sfdxProjectPath, JSON.stringify(sfdxProject, null, 2));

  execCmd('project:deploy:start --source-dir force-app', { ensureExitCode: 0, cli: 'sf' });
  return session;
}