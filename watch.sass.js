import 'dotenv/config.js'
import { DirectoryWatcher } from './src/DirectoryWatcher.js'

const watcher = new DirectoryWatcher(process.env.WEB_DIR)
watcher.stats()

try {
  if (watcher.isValid()) {
    watcher.start(process.argv.slice(2, 3).includes('with-versioning'))
  }
} catch (e) {
  console.error(e)
}
