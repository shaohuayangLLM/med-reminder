import { PropsWithChildren, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    const updateManager = Taro.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          Taro.showModal({
            title: '更新提示',
            content: '新版本已准备好，是否重启应用？',
            success(modalRes) {
              if (modalRes.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        })
        updateManager.onUpdateFailed(() => {
          Taro.showModal({
            title: '更新提示',
            content: '新版本下载失败，请删除小程序后重新打开',
            showCancel: false
          })
        })
      }
    })
  }, [])

  return children
}

export default App
