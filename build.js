const path = require('node:path');
const fs = require('node:fs');
const child_process = require('node:child_process');

const targets = {
    ['x86_64-pc-windows-msvc']: {
        folder: 'win64',
        files: ['steam_api64.dll', 'steam_api64.lib'],
        platform: 'win32',
        arch: 'x64'
    },
    ['x86_64-unknown-linux-gnu']: {
        folder: 'linux64',
        files: ['libsteam_api.so'],
        platform: 'linux',
        arch: 'x64'
    },
    ['x86_64-apple-darwin']: {
        folder: 'osx',
        files: ['libsteam_api.dylib'],
        platform: 'darwin',
        arch: 'x64'
    },
    ['aarch64-apple-darwin']: {
        folder: 'osx',
        files: ['libsteam_api.dylib'],
        platform: 'darwin',
        arch: 'arm64'
    }
}

const target = targets[process.argv.at(-1)] || Object.values(targets).find(t => t.platform === process.platform && t.arch === process.arch)

const dist = path.join(__dirname, 'dist', target.folder)

// 从 steamworks-rs 子模块中获取 SDK 文件
const redist = path.join(__dirname, 'steamworks-rs/steamworks-sys/lib/steam/redistributable_bin', target.folder)

console.log('[build] SDK 路径:', redist)

target.files.forEach(file => {
    const [source, dest] = [path.join(redist, file), path.join(dist, file)]
    try { fs.mkdirSync(path.dirname(dest), { recursive: true }) } catch { }
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest)
        console.log('[build] 复制 SDK 文件:', file)
    } else {
        console.warn('[build] SDK 文件不存在:', source)
    }
})

const relative = path.relative(process.cwd(), dist)

// 过滤掉空参数
const extraArgs = process.argv.slice(2).filter(arg => arg.trim() !== '')
const params = [
    'build',
    '--platform',
    '--no-dts-header',
    '--js', 'false',
    '--dts', '../../client.d.ts',
    relative,
    ...extraArgs
]

// Windows 需要 shell: true 来运行 npm 包的命令
child_process.spawn('napi', params, { stdio: 'inherit', shell: true })
    .on('exit', err => {
        if (err) {
            throw err;
        }
    })
