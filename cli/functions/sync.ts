export async function sync(name?: string) {
  /**
    * 1. compare the config in module.json (user editable) and data.json.
    * 1.1 if they are same just download the remote config (same as sync)
    * 1.2 if not same
    * 1.2.1 check what properties have changed
    * 1.2.2 download the remote config
    * 1.2.3 update the new properties
    * 1.2.4 upload the final result to the api
    */
}
