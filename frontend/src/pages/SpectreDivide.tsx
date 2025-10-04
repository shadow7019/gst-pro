import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  Crosshair, 
  Users, 
  Zap, 
  Shield, 
  Target,
  Play,
  Pause,
  RotateCcw,
  Info
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'

interface Position {
  x: number
  y: number
}

interface Character {
  id: number
  position: Position
  health: number
  isActive: boolean
  color: string
}

interface Enemy {
  id: number
  position: Position
  health: number
}

export default function SpectreDivide() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [score, setScore] = useState(0)
  const [characters, setCharacters] = useState<Character[]>([
    { id: 1, position: { x: 100, y: 300 }, health: 100, isActive: true, color: '#3b82f6' },
    { id: 2, position: { x: 700, y: 300 }, health: 100, isActive: false, color: '#8b5cf6' }
  ])
  const [activeCharacter, setActiveCharacter] = useState(0)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<{ x: number, y: number, vx: number, vy: number, fromChar: number }[]>([])
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({})

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const CHARACTER_SIZE = 20
  const ENEMY_SIZE = 15
  const BULLET_SIZE = 5
  const MOVE_SPEED = 5
  const BULLET_SPEED = 10

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }))
      
      // Tab to switch between characters
      if (e.key === 'Tab') {
        e.preventDefault()
        setActiveCharacter(prev => (prev + 1) % 2)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle mouse click for shooting
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleClick = (e: MouseEvent) => {
      if (!gameStarted || gamePaused) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const char = characters[activeCharacter]
      const dx = mouseX - char.position.x
      const dy = mouseY - char.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        setBullets(prev => [...prev, {
          x: char.position.x,
          y: char.position.y,
          vx: (dx / distance) * BULLET_SPEED,
          vy: (dy / distance) * BULLET_SPEED,
          fromChar: char.id
        }])
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [gameStarted, gamePaused, characters, activeCharacter])

  // Spawn enemies
  useEffect(() => {
    if (!gameStarted || gamePaused) return

    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? 'left' : 'right'
      const newEnemy: Enemy = {
        id: Date.now(),
        position: {
          x: side === 'left' ? 0 : CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT
        },
        health: 50
      }
      setEnemies(prev => [...prev, newEnemy])
    }, 2000)

    return () => clearInterval(interval)
  }, [gameStarted, gamePaused])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gamePaused) return

    const gameLoop = setInterval(() => {
      // Move active character
      setCharacters(prev => prev.map((char, idx) => {
        if (idx === activeCharacter) {
          const newPos = { ...char.position }
          if (keys['w'] || keys['arrowup']) newPos.y = Math.max(0, newPos.y - MOVE_SPEED)
          if (keys['s'] || keys['arrowdown']) newPos.y = Math.min(CANVAS_HEIGHT, newPos.y + MOVE_SPEED)
          if (keys['a'] || keys['arrowleft']) newPos.x = Math.max(0, newPos.x - MOVE_SPEED)
          if (keys['d'] || keys['arrowright']) newPos.x = Math.min(CANVAS_WIDTH, newPos.x + MOVE_SPEED)
          return { ...char, position: newPos }
        }
        return char
      }))

      // Move bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy
        }))
        .filter(bullet => 
          bullet.x >= 0 && bullet.x <= CANVAS_WIDTH &&
          bullet.y >= 0 && bullet.y <= CANVAS_HEIGHT
        )
      )

      // Move enemies towards nearest character
      setEnemies(prev => prev.map(enemy => {
        const nearestChar = characters.reduce((nearest, char) => {
          const distToEnemy = Math.sqrt(
            Math.pow(char.position.x - enemy.position.x, 2) +
            Math.pow(char.position.y - enemy.position.y, 2)
          )
          const distToNearest = Math.sqrt(
            Math.pow(nearest.position.x - enemy.position.x, 2) +
            Math.pow(nearest.position.y - enemy.position.y, 2)
          )
          return distToEnemy < distToNearest ? char : nearest
        })

        const dx = nearestChar.position.x - enemy.position.x
        const dy = nearestChar.position.y - enemy.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          return {
            ...enemy,
            position: {
              x: enemy.position.x + (dx / distance) * 2,
              y: enemy.position.y + (dy / distance) * 2
            }
          }
        }
        return enemy
      }))

      // Check bullet-enemy collisions
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets]
        setEnemies(prevEnemies => {
          const remainingEnemies = prevEnemies.map(enemy => {
            for (let i = remainingBullets.length - 1; i >= 0; i--) {
              const bullet = remainingBullets[i]
              const dx = bullet.x - enemy.position.x
              const dy = bullet.y - enemy.position.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < ENEMY_SIZE) {
                remainingBullets.splice(i, 1)
                const newHealth = enemy.health - 25
                if (newHealth <= 0) {
                  setScore(prev => prev + 10)
                  return null
                }
                return { ...enemy, health: newHealth }
              }
            }
            return enemy
          }).filter(enemy => enemy !== null) as Enemy[]
          return remainingEnemies
        })
        return remainingBullets
      })

      // Check character-enemy collisions
      setCharacters(prevChars => {
        const updatedChars = prevChars.map(char => {
          let damage = 0
          enemies.forEach(enemy => {
            const dx = char.position.x - enemy.position.x
            const dy = char.position.y - enemy.position.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < CHARACTER_SIZE + ENEMY_SIZE) {
              damage += 5
            }
          })
          return { ...char, health: Math.max(0, char.health - damage) }
        })

        // Game over if both characters are dead
        if (updatedChars.every(char => char.health <= 0)) {
          setGameStarted(false)
        }

        return updatedChars
      })

    }, 1000 / 30) // 30 FPS

    return () => clearInterval(gameLoop)
  }, [gameStarted, gamePaused, keys, activeCharacter, characters, enemies])

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CANVAS_WIDTH, i)
      ctx.stroke()
    }

    if (!gameStarted) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Click START to Play', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      return
    }

    // Draw characters
    characters.forEach((char, idx) => {
      if (char.health <= 0) return

      // Character circle
      ctx.fillStyle = idx === activeCharacter ? char.color : `${char.color}88`
      ctx.beginPath()
      ctx.arc(char.position.x, char.position.y, CHARACTER_SIZE, 0, Math.PI * 2)
      ctx.fill()

      // Active indicator
      if (idx === activeCharacter) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(char.position.x, char.position.y, CHARACTER_SIZE + 5, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Health bar
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(char.position.x - 20, char.position.y - 35, 40, 5)
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(char.position.x - 20, char.position.y - 35, 40 * (char.health / 100), 5)
    })

    // Draw bullets
    bullets.forEach(bullet => {
      const char = characters.find(c => c.id === bullet.fromChar)
      ctx.fillStyle = char?.color || '#ffffff'
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(enemy.position.x, enemy.position.y, ENEMY_SIZE, 0, Math.PI * 2)
      ctx.fill()

      // Enemy health bar
      ctx.fillStyle = '#7f1d1d'
      ctx.fillRect(enemy.position.x - 15, enemy.position.y - 25, 30, 3)
      ctx.fillStyle = '#fca5a5'
      ctx.fillRect(enemy.position.x - 15, enemy.position.y - 25, 30 * (enemy.health / 50), 3)
    })

  }, [gameStarted, characters, enemies, bullets, activeCharacter])

  const startGame = () => {
    setGameStarted(true)
    setGamePaused(false)
    setScore(0)
    setCharacters([
      { id: 1, position: { x: 100, y: 300 }, health: 100, isActive: true, color: '#3b82f6' },
      { id: 2, position: { x: 700, y: 300 }, health: 100, isActive: false, color: '#8b5cf6' }
    ])
    setEnemies([])
    setBullets([])
  }

  const togglePause = () => {
    setGamePaused(!gamePaused)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Spectre Divide</h1>
        <p className="text-gray-600">Tactical shooter with dual character control</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to Play</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>WASD / Arrow Keys:</strong> Move active character</li>
            <li><strong>Tab:</strong> Switch between characters</li>
            <li><strong>Mouse Click:</strong> Shoot in direction of cursor</li>
            <li><strong>Objective:</strong> Defend both characters and eliminate enemies</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Game Arena</CardTitle>
                <div className="flex gap-2">
                  {!gameStarted && (
                    <Button onClick={startGame} className="gap-2">
                      <Play className="h-4 w-4" />
                      Start Game
                    </Button>
                  )}
                  {gameStarted && (
                    <>
                      <Button onClick={togglePause} variant="outline" className="gap-2">
                        {gamePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        {gamePaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button onClick={startGame} variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Restart
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-gray-300 rounded-lg w-full"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{score}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Characters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {characters.map((char, idx) => (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg border-2 ${
                    idx === activeCharacter
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: char.color }}
                      />
                      <span className="font-medium">
                        Character {char.id}
                        {idx === activeCharacter && ' (Active)'}
                      </span>
                    </div>
                    {idx === activeCharacter && <Crosshair className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Health</span>
                      <span>{char.health}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          char.health > 50
                            ? 'bg-green-500'
                            : char.health > 20
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${char.health}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Enemies</span>
                <span className="font-semibold">{enemies.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bullets</span>
                <span className="font-semibold">{bullets.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Duality System
              </CardTitle>
              <CardDescription>
                Inspired by Spectre Divide's unique mechanic
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              Control two characters simultaneously! Switch between them using Tab
              to defend multiple positions or create crossfire opportunities.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
