import { InstanceId, SpecWithRelativeRoot } from "cypress-cloud/types";
import { error, warn } from "../log";
import { getFailedDummyResult } from "../results";
import {
  backfillException,
  specResultsToCypressResults,
} from "../results/mapResult";
import { SpecResult } from "../runner/spec.type";

import Debug from "debug";
import { ConfigState } from "./config";
const debug = Debug("currents:state");

type InstanceExecutionState = {
  instanceId: InstanceId;
  spec: SpecWithRelativeRoot;
  output?: string;
  specBefore?: Date;
  createdAt: Date;
  runResults?: CypressCommandLine.CypressRunResult;
  runResultsReportedAt?: Date;
  specAfter?: Date;
  specAfterResults?: SpecResult;
  reportStartedAt?: Date;
  executionsCount: number;
  timeoutsCount: number;
};

export class ExecutionState {
  private state: Record<InstanceId, InstanceExecutionState> = {};

  public getSpecTimeouts(specRelative: string) {
    return this.getSpecRelative(specRelative).timeoutsCount;
  }

  public setSpecTimedout(specRelative: string) {
    this.getSpecRelative(specRelative).timeoutsCount++;
  }

  public getExecutionsCount(specRelative: string) {
    return this.getSpecRelative(specRelative).executionsCount;
  }

  public incrementExecutionsCount(specRelative: string) {
    this.getSpecRelative(specRelative).executionsCount++;
  }

  public hasSpecAfterResults(specRelative: string) {
    return !!this.getSpecRelative(specRelative)?.specAfterResults;
  }
  public getResults(configState: ConfigState) {
    return Object.values(this.state).map((i) =>
      this.getInstanceResults(configState, i.instanceId)
    );
  }

  public getInstance(instanceId: InstanceId) {
    return this.state[instanceId];
  }

  public getSpecRelative(spec: string) {
    const result = Object.values(this.state).find(
      (i) => i.spec.relative === spec
    );
    if (!result) {
      throw new Error('Cannot find execution state for spec "' + spec + '"');
    }
    return result;
  }

  public getSpecAbsolute(spec: string) {
    return Object.values(this.state).find((i) => i.spec.absolute === spec);
  }

  public initInstance({
    instanceId,
    spec,
  }: {
    instanceId: InstanceId;
    spec: InstanceExecutionState["spec"];
  }) {
    debug('Init execution state for "%s"', spec);
    this.state[instanceId] = {
      instanceId,
      spec,
      createdAt: new Date(),
      executionsCount: 0,
      timeoutsCount: 0,
    };
  }

  public setSpecBefore(spec: string) {
    const i = this.getSpecRelative(spec);
    if (!i) {
      warn('Cannot find execution state for spec "%s"', spec);
      return;
    }

    i.specBefore = new Date();
  }

  public setSpecAfter(spec: string, results: SpecResult) {
    const i = this.getSpecRelative(spec);
    if (!i) {
      warn('Cannot find execution state for spec "%s"', spec);
      return;
    }
    i.specAfter = new Date();
    i.specAfterResults = results;
  }

  public setSpecOutput(spec: string, output: string) {
    const i = this.getSpecRelative(spec);
    if (!i) {
      warn('Cannot find execution state for spec "%s"', spec);
      return;
    }
    this.setInstanceOutput(i.instanceId, output);
  }

  public setInstanceOutput(instanceId: string, output: string) {
    const i = this.state[instanceId];
    if (!i) {
      warn('Cannot find execution state for instance "%s"', instanceId);
      return;
    }
    if (i.output) {
      debug('Instance "%s" already has output', instanceId);
      return;
    }
    i.output = output;
  }

  public setInstanceResult(
    instanceId: string,
    results: CypressCommandLine.CypressRunResult
  ) {
    const i = this.state[instanceId];
    if (!i) {
      warn('Cannot find execution state for instance "%s"', instanceId);
      return;
    }
    i.runResults = results;
    i.runResultsReportedAt = new Date();
  }

  public getInstanceResults(
    configState: ConfigState,
    instanceId: string
  ): CypressCommandLine.CypressRunResult {
    const i = this.getInstance(instanceId);

    if (!i) {
      error('Cannot find execution state for instance "%s"', instanceId);

      return getFailedDummyResult(configState, {
        specs: ["unknown"],
        error: "Cannot find execution state for instance",
      });
    }

    // use spec:after results - it can become available before run results
    if (i.specAfterResults) {
      return backfillException(
        specResultsToCypressResults(configState, i.specAfterResults)
      );
    }

    if (i.runResults) {
      return backfillException(i.runResults);
    }

    if (i.executionsCount == i.timeoutsCount && i.timeoutsCount > 0) {
      return getFailedDummyResult(configState, {
        specs: [i.spec],
        error: `Failed to complete before spec timeout\n
Timeout: ${configState.getSpecTimeout()} seconds
Retries: ${configState.getSpecRetryLimit()}`,
      });
    }
    debug('No results detected for "%s"', i.spec);
    return getFailedDummyResult(configState, {
      specs: [i.spec],
      error: `No results detected for the spec file. That usually happens because of cypress crash. See the console output for details.`,
    });
  }
}
