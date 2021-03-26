import 'dotenv/config.js'
import { DirectoryWatcher } from './src/DirectoryWatcher.js'

const watcher = new DirectoryWatcher(process.env.WEB_DIR)
watcher.stats()

try {
  if (watcher.isValid()) {
    watcher.start()
  }
} catch (e) {
  console.error(e)
}
