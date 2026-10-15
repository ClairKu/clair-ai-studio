import assert from "node:assert/strict";

export function validateAppUsage(data) {
  const usage = data.app_usage;
  assert.equal(usage?.state, "confirmed", "App usage must be refreshed");
  assert.equal(usage.as_of, data.meta.data_cutoff, "App usage cutoff differs");
  assert.deepEqual(usage.native_libs, ["iOS", "Android", "HarmonyOS"]);
  assert.deepEqual(usage.device_platforms, [3, 4, 5]);
  const populations = { all: data.metrics.bound_accounts, new: data.metrics.new_accounts, existing: data.metrics.existing_accounts };
  for (const [cohort, population] of Object.entries(populations)) {
    const row = usage.cohorts[cohort];
    assert.equal(row.population_accounts, population);
    for (const count of Object.values(row)) assert.ok(Number.isInteger(count) && count >= 0 && count <= population);
    assert.ok(row.both_users <= Math.min(row.native_users, row.device_users));
    assert.equal(row.users, row.native_users + row.device_users - row.both_users, "App evidence must be deduplicated");
    assert.ok(row.after_binding_users <= row.users);
    const profile = data.profile.cohorts[cohort].dimensions.find(item => item.id === "app_usage_status");
    assert.equal(profile.state, "confirmed");
    assert.equal(profile.buckets.find(item => item.id === "app_used").accounts, row.users);
    assert.equal(profile.buckets.find(item => item.id === "app_no_record").accounts, population - row.users);
  }
  for (const key of Object.keys(usage.cohorts.all)) {
    assert.equal(usage.cohorts.all[key], Object.entries(usage.cohorts).filter(([cohort]) => cohort !== "all").reduce((sum, [, row]) => sum + row[key], 0));
  }
}
