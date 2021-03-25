import dotenv from 'dotenv'
import { DirectoryWatcher } from './src/DirectoryWatcher.js'

dotenv.config()

const watcher = new DirectoryWatcher(process.env.WEB_DIR)
watcher.stats()

try {
  if (watcher.isValid()) {
    watcher.start()
  }
} catch (e) {
  console.error(e)
}
