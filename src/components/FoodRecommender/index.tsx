import {useState, useEffect, useRef} from "react"
import {Button, Card, Radio, Typography, Space, ConfigProvider, Modal, Input, message} from "antd"
import {ThunderboltOutlined, SettingOutlined, PauseOutlined} from "@ant-design/icons"
import "./index.css"

const {Title, Text} = Typography
const {TextArea} = Input

interface FoodRecommenderProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultFoodOptions = {
  breakfast: ["豆浆油条", "包子", "煎饼果子", "粥", "三明治", "牛奶麦片"],
  lunch: ["红烧肉盖饭", "兰州拉面", "麻辣香锅", "沙拉", "汉堡", "披萨", "寿司"],
  dinner: ["火锅", "烤鱼", "炒菜", "烧烤", "西餐牛排", "意大利面"],
  night: ["烤串", "炸鸡", "夜宵套餐", "小龙虾", "关东煮", "泡面"],
}

export default function FoodRecommender({ isOpen, onClose }: FoodRecommenderProps) {
  const [mealTime, setMealTime] = useState("lunch")
  const [recommendation, setRecommendation] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [foodOptions, setFoodOptions] = useState(defaultFoodOptions)
  const [settingsJson, setSettingsJson] = useState("")
  const [isRolling, setIsRolling] = useState(false)
  const rollInterval = useRef<NodeJS.Timeout>()

  // 从 localStorage 加载用户设置
  useEffect(() => {
    const savedOptions = localStorage.getItem('foodOptions')
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions)
        setFoodOptions(parsedOptions)
        setSettingsJson(JSON.stringify(parsedOptions, null, 2))
      } catch (error) {
        console.error('加载菜式设置失败:', error)
      }
    } else {
      setSettingsJson(JSON.stringify(defaultFoodOptions, null, 2))
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (rollInterval.current) {
        clearInterval(rollInterval.current)
      }
    }
  }, [])

  const getRandomFood = () => {
    const options =
      mealTime === "all"
        ? [...foodOptions.breakfast, ...foodOptions.lunch, ...foodOptions.dinner, ...foodOptions.night]
        : foodOptions[mealTime as keyof typeof foodOptions]

    const randomIndex = Math.floor(Math.random() * options.length)
    return options[randomIndex]
  }

  const startRolling = () => {
    setIsRolling(true)
    setRecommendation("")
    
    // 每 100ms 更新一次菜式
    rollInterval.current = setInterval(() => {
      setRecommendation(getRandomFood())
    }, 100)
  }

  const stopRolling = () => {
    if (rollInterval.current) {
      clearInterval(rollInterval.current)
    }
    setIsRolling(false)
  }

  const handleButtonClick = () => {
    if (isRolling) {
      stopRolling()
    } else {
      startRolling()
    }
  }

  const handleSaveSettings = () => {
    try {
      const parsedOptions = JSON.parse(settingsJson)
      // 验证 JSON 格式是否正确
      if (!parsedOptions.breakfast || !parsedOptions.lunch || !parsedOptions.dinner || !parsedOptions.night) {
        throw new Error('JSON 格式不正确，必须包含 breakfast、lunch、dinner、night 四个字段')
      }
      // 验证每个字段是否为数组
      if (!Array.isArray(parsedOptions.breakfast) || !Array.isArray(parsedOptions.lunch) || 
          !Array.isArray(parsedOptions.dinner) || !Array.isArray(parsedOptions.night)) {
        throw new Error('每个字段必须是一个数组')
      }
      
      setFoodOptions(parsedOptions)
      localStorage.setItem('foodOptions', settingsJson)
      message.success('设置保存成功')
      setIsSettingsOpen(false)
    } catch (error: any) {
      message.error(`保存失败：${error.message}`)
    }
  }

  const handleResetSettings = () => {
    setFoodOptions(defaultFoodOptions)
    setSettingsJson(JSON.stringify(defaultFoodOptions, null, 2))
    localStorage.removeItem('foodOptions')
    message.success('已重置为默认设置')
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#f26522",
        },
      }}
    >
      <Modal
        title="今天吃什么"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={800}
        centered
        bodyStyle={{ padding: '16px' }}
      >
        <div className="food-recommender">
          <div className="content" style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '16px', position: 'relative' }}>
              <Radio.Group
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                buttonStyle="solid"
                className="meal-tabs"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '8px'
                }}
              >
                <Radio.Button value="all">全部</Radio.Button>
                <Radio.Button value="breakfast">早餐</Radio.Button>
                <Radio.Button value="lunch">午餐</Radio.Button>
                <Radio.Button value="dinner">晚餐</Radio.Button>
                <Radio.Button value="night">夜宵</Radio.Button>
              </Radio.Group>
              <Button 
                type="text"
                icon={<SettingOutlined />} 
                onClick={() => setIsSettingsOpen(true)}
                style={{ 
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px 8px'
                }}
              />
            </div>

            <Card 
              className="recommendation-card"
              style={{ 
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Space direction="vertical" size="large" style={{width: "100%", textAlign: "center"}}>
                <Text className="question" style={{ fontSize: '18px' }}>不知道吃什么？</Text>
                <Title level={3} className="instruction">
                  {isRolling ? '点击停止' : '点击下方按钮开始'}
                </Title>
                {recommendation && (
                  <Title level={2} className="result" style={{ 
                    color: '#f26522',
                    marginTop: '16px',
                    fontSize: '32px',
                    transition: 'all 0.1s ease'
                  }}>
                    {recommendation}
                  </Title>
                )}
              </Space>
            </Card>

            <Button
              type="primary"
              size="large"
              icon={isRolling ? <PauseOutlined /> : <ThunderboltOutlined />}
              className="recommend-button"
              onClick={handleButtonClick}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '18px',
                borderRadius: '24px',
                background: isRolling 
                  ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                  : 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(255, 154, 158, 0.2)',
              }}
            >
              {isRolling ? '停止' : '开始推荐'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 设置弹窗 */}
      <Modal
        title="菜式设置"
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        width={600}
        footer={[
          <Button key="reset" onClick={handleResetSettings}>
            重置默认
          </Button>,
          <Button key="cancel" onClick={() => setIsSettingsOpen(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveSettings}>
            保存
          </Button>,
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            请按照 JSON 格式设置菜式，必须包含 breakfast、lunch、dinner、night 四个数组字段
          </Text>
        </div>
        <TextArea
          value={settingsJson}
          onChange={(e) => setSettingsJson(e.target.value)}
          rows={15}
          style={{ fontFamily: 'monospace' }}
          placeholder="请输入 JSON 格式的菜式设置"
        />
      </Modal>
    </ConfigProvider>
  )
}
