import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css'


function App() {
  return (
    <>
      <BrowserRouter>
        <nav>
          <Link to="/">Home</Link> |{" "}
          <Link to="/statistics">Statistics</Link> |{" "}
          <Link to="/info">Info</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/info" element={<Info />} />
        </Routes>
      </BrowserRouter>

    </>
  )
}

function Home() {
    const [data, setData] = useState([])
    const [tagsList, setTagsList] = useState([])
    const [name, setName] = useState("")
    const [posting, setPosting] = useState(false)
    const [error, setError] = useState(null)

    const [editingId, setEditingId] = useState(null)
    const [editingName, setEditingName] = useState("")

    const [selectedFilterTags, setSelectedFilterTags] = useState([])

    const [newTagName, setNewTagName] = useState("")
    const [postingTag, setPostingTag] = useState(false)

    const [timestamps, setTimestamps] = useState([])
    const [activeTaskIds, setActiveTaskIds] = useState(new Set())

    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3010/tasks')
        const tasks = await response.json()
        setData(tasks)
      } catch (err) {
        setError(err.message)
      }
    }

    const fetchTags = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3010/tags')
        const tags = await res.json()
        setTagsList(tags)
      } catch (err) {
        setError(err.message)
      }
    }

    const fetchTimestamps = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3010/timestamps')
        const times = await res.json()
        setTimestamps(times)
        
        // Determine which tasks are currently active
        const activeIds = new Set()
        const taskLastEvent = {}
        
        times.forEach(ts => {
          if (!taskLastEvent[ts.task] || new Date(ts.timestamp) > new Date(taskLastEvent[ts.task].timestamp)) {
            taskLastEvent[ts.task] = ts
          }
        })
        
        Object.entries(taskLastEvent).forEach(([taskId, event]) => {
          if (event.type === 0) {
            activeIds.add(Number(taskId))
          }
        })
        
        setActiveTaskIds(activeIds)
      } catch (err) {
        setError(err.message)
      }
    }

    useEffect(() => {
      fetchData()
      fetchTags()
      fetchTimestamps()
    }, [])

    const handlePost = async (e) => {
      e.preventDefault()
      setPosting(true)
      setError(null)
      try {
        const payload = { name, tags: "", "additional data": "" }
        const response = await fetch('http://127.0.0.1:3010/tasks', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error("Request failed")
        await response.json()
        setName("")
        await fetchData()
      } catch (err) {
        setError(err.message)
      } finally {
        setPosting(false)
      }
    }

    const parseTagIds = (tagsString) => {
      if (!tagsString) return []
      return tagsString.split(',').map(s => s.trim()).filter(s => s !== '').map(Number)
    }

    const handleToggleTag = async (taskId, tagId, checked) => {
      setError(null)
      try {
        const task = data.find(t => t.id === taskId)
        if (!task) return
        const current = parseTagIds(task.tags)
        const next = checked ? Array.from(new Set([...current, tagId])) : current.filter(id => id !== tagId)
        const nextTagsString = next.join(',')
        const res = await fetch(`http://127.0.0.1:3010/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: nextTagsString })
        })
        if (!res.ok) throw new Error('Failed to update tags')
        setData(prev => prev.map(t => t.id === taskId ? { ...t, tags: nextTagsString } : t))
      } catch (err) {
        setError(err.message)
      }
    }

    const handleDeleteTask = async (taskId) => {
      setError(null)
      if (!window.confirm('Delete this task?')) return
      try {
        const res = await fetch(`http://127.0.0.1:3010/tasks/${taskId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete task')
        setData(prev => prev.filter(t => t.id !== taskId))
      } catch (err) {
        setError(err.message)
      }
    }

    const startEdit = (task) => {
      setEditingId(task.id)
      setEditingName(task.name ?? "")
    }

    const cancelEdit = () => {
      setEditingId(null)
      setEditingName("")
    }

    const saveEdit = async (taskId) => {
      const newName = (editingName ?? "").trim()
      if (!newName) {
        setError("Task name cannot be empty")
        return
      }
      setError(null)
      try {
        const res = await fetch(`http://127.0.0.1:3010/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        })
        if (!res.ok) throw new Error('Failed to update task name')
        setData(prev => prev.map(t => t.id === taskId ? { ...t, name: newName } : t))
        cancelEdit()
      } catch (err) {
        setError(err.message)
      }
    }

    const handleToggleFilterTag = (tagId) => {
      setSelectedFilterTags(prev => 
        prev.includes(tagId) 
          ? prev.filter(id => id !== tagId) 
          : [...prev, tagId]
      )
    }

    const clearFilters = () => {
      setSelectedFilterTags([])
    }

    const filteredData = selectedFilterTags.length === 0 
      ? data 
      : data.filter(task => {
          const taskTagIds = parseTagIds(task?.tags)
          return selectedFilterTags.every(filterTagId => taskTagIds.includes(filterTagId))
        })
    
    const handlePostTag = async (e) => {
      e.preventDefault()
      setPostingTag(true)
      setError(null)
      try {
        const payload = { name: newTagName, additional_data: "" }
        const response = await fetch('http://127.0.0.1:3010/tags', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error("Failed to create tag")
        await response.json()
        setNewTagName("")
        await fetchTags()
      } catch (err) {
        setError(err.message)
      } finally {
        setPostingTag(false)
      }
    }

    const handleDeleteTag = async (tagId) => {
      setError(null)
      if (!window.confirm('Delete this tag? It will be removed from all tasks.')) return
      try {
        const res = await fetch(`http://127.0.0.1:3010/tags/${tagId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete tag')
        
        setSelectedFilterTags(prev => prev.filter(id => id !== tagId))
        
        setData(prev => prev.map(task => {
          const taskTagIds = parseTagIds(task.tags)
          if (taskTagIds.includes(tagId)) {
            const newTagIds = taskTagIds.filter(id => id !== tagId)
            return { ...task, tags: newTagIds.join(',') }
          }
          return task
        }))
        
        setTagsList(prev => prev.filter(t => t.id !== tagId))
      } catch (err) {
        setError(err.message)
      }
    }
    const handleToggleActivity = async (taskId) => {
      setError(null)
      const isActive = activeTaskIds.has(taskId)
      const newType = isActive ? 1 : 0 // 0 = start, 1 = stop
  
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const ms = String(now.getMilliseconds()).padStart(3, '0')
      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
      
      try {
        const payload = {
          timestamp: timestamp,
          task: taskId,
          type: newType
        }
        const res = await fetch('http://127.0.0.1:3010/timestamps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Failed to log timestamp')
        
        await fetchTimestamps()
      } catch (err) {
        setError(err.message)
      }
    }

    const calculateTotalActiveTime = (taskId) => {
      const taskTimestamps = timestamps
        .filter(ts => ts.task === taskId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      let totalMs = 0
      let lastStart = null
      
      taskTimestamps.forEach(ts => {
        if (ts.type === 0) {
          lastStart = new Date(ts.timestamp)
        } else if (ts.type === 1 && lastStart) {
          totalMs += new Date(ts.timestamp) - lastStart
          lastStart = null
        }
      })
      
      const totalSeconds = Math.floor(totalMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }
    }
        

  return (
    <div className="box">
      <h2>Tasks</h2>
      <h3>Add a Task</h3>
      <div className="post-area">
        <form onSubmit={handlePost} className="post-form" >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task Name"
            className="text-input"
          />
          <button type="submit" className="btn" disabled={posting || !name.trim()}>
            {posting ? "Posting..." : "Add Task"}
          </button>
        </form>
        <h3>Add a Tag</h3>
        <form onSubmit={handlePostTag} className="post-form" >
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag Name"
            className="text-input"
          />
          <button type="submit" className="btn" disabled={postingTag || !newTagName.trim()}>
            {postingTag ? "Posting..." : "Add Tag"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>

      {/* Filter UI */}
      <div className="filter-section">
        <div className="filter-header">
          <h3>Filter by Tags:</h3>
          {selectedFilterTags.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="filter-tags">
          {tagsList.map(tag => (
            <button
              key={tag.id}
              className={`filter-tag ${selectedFilterTags.includes(tag.id) ? 'active' : ''}`}
              onClick={() => handleToggleFilterTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="tiles">
        {filteredData.length === 0 && <div className="tile empty">
          {selectedFilterTags.length > 0 ? 'No tasks match the selected filters' : 'No tasks found'}
        </div>}
        {filteredData.map((item, index) => {
          const selectedTagIds = parseTagIds(item?.tags)
          const isEditing = editingId === item.id
          const isActive = activeTaskIds.has(item.id)
          const totalTime = calculateTotalActiveTime(item.id)
          
          return (
            <div className="tile" key={item?.id ?? index}>
              <div className="tile-actions">
                <button className="tile-edit" onClick={() => startEdit(item)} aria-label="Edit task">✎</button>
                <button className="tile-close" onClick={() => handleDeleteTask(item.id)} aria-label="Delete task">×</button>
              </div>
              {isEditing ? (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); saveEdit(item.id) }}>
                  <input
                    className="edit-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button type="button" className="btn" onClick={() => saveEdit(item.id)} disabled={!editingName.trim()}>Save</button>
                    <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                  </div>
                </form>
              ) : (
                <h3 className="tile-title">{item?.name ?? 'Untitled'}</h3>
              )}

              <div className="activity-section">
                <button 
                  className={`activity-toggle ${isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleActivity(item.id)}
                >
                  <span className="activity-indicator"></span>
                  <span className="activity-label">{isActive ? 'Active' : 'Inactive'}</span>
                </button>
                {!isActive && <div className="total-time">Total: {totalTime}</div>}
              </div>

              <div className="tag-list">
                {tagsList.map(tag => (
                  <label className="tag-item" key={tag.id}>
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(e) => handleToggleTag(item.id, tag.id, e.target.checked)}
                    />
                    <span className="tag-name">{tag.name}</span>
                    <button 
                      className="tag-delete-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteTag(tag.id)
                      }}
                      aria-label="Delete tag"
                      type="button"
                    >
                      ×
                    </button>
                  </label>
                ))}
              </div>

              {item?.['additional_data'] && <div className="tile-meta">{item['additional_data']}</div>}
              {item?.description && <p className="tile-desc">{item.description}</p>}
            </div>
          )
        })}
      </div>
    </div>
  );
}


function Statistics() {
  const [tasks, setTasks] = useState([])
  const [tags, setTags] = useState([])
  const [timestamps, setTimestamps] = useState([])
  const [error, setError] = useState(null)
  
  const [defaultStart, setDefaultStart] = useState('')
  const [defaultEnd, setDefaultEnd] = useState('')
  const [editingDefaults, setEditingDefaults] = useState(false)
  
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [chartStartDate, setChartStartDate] = useState('')
  const [chartEndDate, setChartEndDate] = useState('')
  
  const [selectedDetailsTaskId, setSelectedDetailsTaskId] = useState(null)
  const [detailsInterval, setDetailsInterval] = useState({ start: '', end: '' })
  
  const [editableIntervals, setEditableIntervals] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const getTodayRange = () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59)
    
    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    return {
      start: formatDateTime(startOfDay),
      end: formatDateTime(endOfDay)
    }
  }
  
  const initializeDetailsInterval = () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0)
    
    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setDetailsInterval({
      start: formatDateTime(startOfDay),
      end: formatDateTime(now)
    })
  }
  
  const todayRange = getTodayRange()
  const [taskInterval, setTaskInterval] = useState({
    start: todayRange.start,
    end: todayRange.end
  })
  
  const [tagInterval, setTagInterval] = useState({
    start: todayRange.start,
    end: todayRange.end
  })
  
  useEffect(() => {
    fetchData()
    fetchDefaultTimes()
    initializeChartDates()
    initializeDetailsInterval()
  }, [])
  
  const initializeChartDates = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    setChartEndDate(`${year}-${month}-${day}`)
    
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const startYear = weekAgo.getFullYear()
    const startMonth = String(weekAgo.getMonth() + 1).padStart(2, '0')
    const startDay = String(weekAgo.getDate()).padStart(2, '0')
    setChartStartDate(`${startYear}-${startMonth}-${startDay}`)
  }
  
  const fetchData = async () => {
    try {
      const [tasksRes, timestampsRes, tagsRes] = await Promise.all([
        fetch('http://127.0.0.1:3010/tasks'),
        fetch('http://127.0.0.1:3010/timestamps'),
        fetch('http://127.0.0.1:3010/tags')
      ])
      
      const tasksData = await tasksRes.json()
      const timestampsData = await timestampsRes.json()
      const tagsData = await tagsRes.json()
      
      setTasks(tasksData)
      setTimestamps(timestampsData)
      setTags(tagsData)
    } catch (err) {
      setError(err.message)
    }
  }
  
  const fetchDefaultTimes = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3010/options/1')
      const option = await res.json()
      
      if (option && option.own_textual_data) {
        try {
          const settings = JSON.parse(option.own_textual_data)
          if (settings.default_interval_start) {
            setDefaultStart(settings.default_interval_start)
          }
          if (settings.default_interval_end) {
            setDefaultEnd(settings.default_interval_end)
          }
        } catch (parseErr) {
          console.log('Could not parse settings JSON')
        }
      }
    } catch (err) {
      console.log('No default times set yet')
    }
  }
  
  const saveDefaultTimes = async () => {
    setError(null)
    try {
      const settings = {
        default_interval_start: defaultStart,
        default_interval_end: defaultEnd
      }
      
      const res = await fetch('http://127.0.0.1:3010/options/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          own_textual_data: JSON.stringify(settings)
        })
      })
      
      if (!res.ok) throw new Error('Failed to save default times')
      
      setEditingDefaults(false)
      alert('Default interval times saved successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const updateTaskInterval = (field, value) => {
    setTaskInterval(prev => ({ ...prev, [field]: value }))
  }
  
  const updateTagInterval = (field, value) => {
    setTagInterval(prev => ({ ...prev, [field]: value }))
  }
  
  const updateDetailsInterval = (field, value) => {
    setDetailsInterval(prev => ({ ...prev, [field]: value }))
  }
  
  const parseTagIds = (tagsString) => {
    if (!tagsString) return []
    return tagsString.split(',').map(s => s.trim()).filter(s => s !== '').map(Number)
  }
  
  const calculateTaskTimeInInterval = (taskId, start, end) => {
    const startTime = new Date(start)
    const endTime = new Date(end)
    
    const taskTimestamps = timestamps
      .filter(ts => ts.task === taskId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    let totalMs = 0
    let lastStart = null
    
    taskTimestamps.forEach(ts => {
      const tsTime = new Date(ts.timestamp)
      
      if (ts.type === 0) {
        if (tsTime >= startTime && tsTime <= endTime) {
          lastStart = tsTime
        } else if (tsTime < startTime) {
          lastStart = startTime
        }
      } else if (ts.type === 1) {
        if (lastStart) {
          const stopTime = tsTime > endTime ? endTime : tsTime
          if (stopTime > lastStart) {
            totalMs += stopTime - lastStart
          }
          lastStart = null
        }
      }
    })
    
    if (lastStart && endTime > lastStart) {
      totalMs += endTime - lastStart
    }
    
    return totalMs
  }
  
  const calculateTagTimeInInterval = (tagId, start, end) => {
    const tasksWithTag = tasks.filter(task => {
      const taskTagIds = parseTagIds(task.tags)
      return taskTagIds.includes(tagId)
    })
    
    let totalMs = 0
    tasksWithTag.forEach(task => {
      totalMs += calculateTaskTimeInInterval(task.id, start, end)
    })
    
    return totalMs
  }
  
  const getActivityIntervals = (taskId, intervalStart, intervalEnd) => {
    if (!taskId || !intervalStart || !intervalEnd) return []
    
    const startTime = new Date(intervalStart)
    const endTime = new Date(intervalEnd)
    const now = new Date()
    
    const taskTimestamps = timestamps
      .filter(ts => ts.task === taskId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    const intervals = []
    let currentStart = null
    let startTimestampId = null
    
    taskTimestamps.forEach(ts => {
      const tsTime = new Date(ts.timestamp)
      
      if (ts.type === 0) {
        currentStart = tsTime
        startTimestampId = ts.id
      } else if (ts.type === 1 && currentStart) {
        if (tsTime >= startTime && currentStart <= endTime) {
          intervals.push({
            id: `${startTimestampId}-${ts.id}`,
            startTimestampId: startTimestampId,
            endTimestampId: ts.id,
            start: currentStart,
            end: tsTime,
            isOngoing: false,
            isNew: false
          })
        }
        currentStart = null
        startTimestampId = null
      }
    })
    
    if (currentStart) {
      if (currentStart <= endTime) {
        const isOngoing = endTime > now
        intervals.push({
          id: `${startTimestampId}-ongoing`,
          startTimestampId: startTimestampId,
          endTimestampId: null,
          start: currentStart,
          end: isOngoing ? null : endTime,
          isOngoing: isOngoing,
          isNew: false
        })
      }
    }
    
    return intervals
  }
  
  const formatDateTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const formatDateTimeForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }
  
  const getActiveTasksForInterval = () => {
    return tasks
      .map(task => ({
        ...task,
        activeTime: calculateTaskTimeInInterval(task.id, taskInterval.start, taskInterval.end)
      }))
      .filter(task => task.activeTime > 0)
      .sort((a, b) => b.activeTime - a.activeTime)
  }

  const getActiveTagsForInterval = () => {
    return tags
      .map(tag => ({
        ...tag,
        activeTime: calculateTagTimeInInterval(tag.id, tagInterval.start, tagInterval.end)
      }))
      .filter(tag => tag.activeTime > 0)
      .sort((a, b) => b.activeTime - a.activeTime)
  }

  const calculateDailyActivity = (taskId, startDate, endDate) => {
    if (!taskId || !startDate || !endDate) return []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) return []
    
    const dailyData = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const activeMs = calculateTaskTimeInInterval(
        taskId,
        dayStart.toISOString(),
        dayEnd.toISOString()
      )
      
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      
      dailyData.push({
        day: `${year}-${month}-${day}`,
        minutes: Math.round(activeMs / 60000)
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dailyData
  }

  useEffect(() => {
    if (selectedDetailsTaskId) {
      const intervals = getActivityIntervals(selectedDetailsTaskId, detailsInterval.start, detailsInterval.end)
      setEditableIntervals(intervals)
      setHasUnsavedChanges(false)
    } else {
      setEditableIntervals([])
    }
  }, [selectedDetailsTaskId, detailsInterval, timestamps])

  const checkOverlaps = (intervals) => {
    const overlapping = new Set()
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const a = intervals[i]
        const b = intervals[j]
        if (!a.start || !b.start) continue
        
        const aStart = new Date(a.start)
        const aEnd = a.end ? new Date(a.end) : new Date(detailsInterval.end)
        const bStart = new Date(b.start)
        const bEnd = b.end ? new Date(b.end) : new Date(detailsInterval.end)
        
        if (aStart < bEnd && bStart < aEnd) {
          overlapping.add(a.id)
          overlapping.add(b.id)
        }
      }
    }
    return overlapping
  }

  const overlappingIntervalIds = checkOverlaps(editableIntervals)

  const updateIntervalTime = (intervalId, field, value) => {
    setEditableIntervals(prev => 
      prev.map(interval => 
        interval.id === intervalId 
          ? { ...interval, [field]: value ? new Date(value) : null }
          : interval
      )
    )
    setHasUnsavedChanges(true)
  }

  const addNewInterval = () => {
    const now = new Date()
    const newInterval = {
      id: `new-${Date.now()}`,
      startTimestampId: null,
      endTimestampId: null,
      start: now,
      end: new Date(now.getTime() + 3600000), // 1 hour later
      isOngoing: false,
      isNew: true
    }
    setEditableIntervals(prev => [...prev, newInterval])
    setHasUnsavedChanges(true)
  }

  const removeInterval = (intervalId) => {
    if (!window.confirm('Remove this interval?')) return
    setEditableIntervals(prev => prev.filter(i => i.id !== intervalId))
    setHasUnsavedChanges(true)
  }

  const saveAllIntervals = async () => {
    setError(null)
    if (!selectedDetailsTaskId) return

    try {
      const existingTimestamps = timestamps.filter(ts => ts.task === selectedDetailsTaskId)
      for (const ts of existingTimestamps) {
        await fetch(`http://127.0.0.1:3010/timestamps/${ts.id}`, { method: 'DELETE' })
      }

      for (const interval of editableIntervals) {
        if (!interval.start) continue

        const startDate = new Date(interval.start)
        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}:${String(startDate.getSeconds()).padStart(2, '0')}.${String(startDate.getMilliseconds()).padStart(3, '0')}`
        
        const startPayload = {
          timestamp: startStr,
          task: selectedDetailsTaskId,
          type: 0
        }
        
        const startRes = await fetch('http://127.0.0.1:3010/timestamps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(startPayload)
        })
        
        if (!startRes.ok) throw new Error('Failed to save start timestamp')

        if (interval.end && !interval.isOngoing) {
          const endDate = new Date(interval.end)
          const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}.${String(endDate.getMilliseconds()).padStart(3, '0')}`
          
          const endPayload = {
            timestamp: endStr,
            task: selectedDetailsTaskId,
            type: 1
          }
          
          const endRes = await fetch('http://127.0.0.1:3010/timestamps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endPayload)
          })
          
          if (!endRes.ok) throw new Error('Failed to save end timestamp')
        }
      }

      await fetchData()
      setHasUnsavedChanges(false)
      alert('Activity intervals saved successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const discardChanges = () => {
    if (!window.confirm('Discard all unsaved changes?')) return
    const intervals = getActivityIntervals(selectedDetailsTaskId, detailsInterval.start, detailsInterval.end)
    setEditableIntervals(intervals)
    setHasUnsavedChanges(false)
  }
  
  const chartData = calculateDailyActivity(selectedTaskId, chartStartDate, chartEndDate)
  const activeTasksInInterval = getActiveTasksForInterval()
  const activeTagsInInterval = getActiveTagsForInterval()
  
  return (
    <div className="box">
      <h2>Statistics</h2>

      <div className="intervals-section">
        <div className="intervals-header">
          <h3>Default Interval Times</h3>
          {!editingDefaults ? (
            <button className="btn btn-sm" onClick={() => setEditingDefaults(true)}>
              Edit Defaults
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm" onClick={saveDefaultTimes}>
                Save Defaults
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingDefaults(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {editingDefaults && (
          <div className="date-range-inputs" style={{ marginBottom: '20px' }}>
            <div className="date-input-group">
              <label htmlFor="default-start">Default Start Time:</label>
              <input
                id="default-start"
                type="time"
                value={defaultStart.split('T')[1] || '00:00'}
                onChange={(e) => {
                  const today = getTodayRange()
                  const date = today.start.split('T')[0]
                  setDefaultStart(`${date}T${e.target.value}`)
                }}
                className="datetime-input"
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="default-end">Default End Time:</label>
              <input
                id="default-end"
                type="time"
                value={defaultEnd.split('T')[1] || '23:59'}
                onChange={(e) => {
                  const today = getTodayRange()
                  const date = today.end.split('T')[0]
                  setDefaultEnd(`${date}T${e.target.value}`)
                }}
                className="datetime-input"
              />
            </div>
          </div>
        )}
        
        <div className="intervals-header">
          <h3>Task Observation Interval</h3>
        </div>
        
        <div className="intervals-list">
          <div className="interval-card">
            <div className="interval-header">
              <h4>Current Task Interval</h4>
            </div>
            
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label htmlFor="task-interval-start">Start:</label>
                <input
                  id="task-interval-start"
                  type="datetime-local"
                  value={taskInterval.start}
                  onChange={(e) => updateTaskInterval('start', e.target.value)}
                  className="datetime-input"
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="task-interval-end">End:</label>
                <input
                  id="task-interval-end"
                  type="datetime-local"
                  value={taskInterval.end}
                  onChange={(e) => updateTaskInterval('end', e.target.value)}
                  className="datetime-input"
                />
              </div>
            </div>
            
            <div className="interval-stats">
              <h4>Active Tasks ({activeTasksInInterval.length})</h4>
              <div className="tiles compact">
                {activeTasksInInterval.length === 0 && (
                  <div className="tile empty">
                    No tasks were active during this interval
                  </div>
                )}
                {activeTasksInInterval.map(task => (
                  <div className="tile stat-tile" key={task.id}>
                    <h5 className="tile-title">{task.name ?? 'Untitled'}</h5>
                    <div className="stat-time">
                      <span className="stat-value">{formatTime(task.activeTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="intervals-header" style={{ marginTop: '24px' }}>
          <h3>Tag Observation Interval</h3>
        </div>
        
        <div className="intervals-list">
          <div className="interval-card">
            <div className="interval-header">
              <h4>Current Tag Interval</h4>
            </div>
            
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label htmlFor="tag-interval-start">Start:</label>
                <input
                  id="tag-interval-start"
                  type="datetime-local"
                  value={tagInterval.start}
                  onChange={(e) => updateTagInterval('start', e.target.value)}
                  className="datetime-input"
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="tag-interval-end">End:</label>
                <input
                  id="tag-interval-end"
                  type="datetime-local"
                  value={tagInterval.end}
                  onChange={(e) => updateTagInterval('end', e.target.value)}
                  className="datetime-input"
                />
              </div>
            </div>
            
            <div className="interval-stats">
              <h4>Active Tags ({activeTagsInInterval.length})</h4>
              <div className="tiles compact">
                {activeTagsInInterval.length === 0 && (
                  <div className="tile empty">
                    No tags had activity during this interval
                  </div>
                )}
                {activeTagsInInterval.map(tag => (
                  <div className="tile stat-tile" key={tag.id}>
                    <h5 className="tile-title">{tag.name ?? 'Untitled'}</h5>
                    <div className="stat-time">
                      <span className="stat-value">{formatTime(tag.activeTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="intervals-header" style={{ marginTop: '24px' }}>
          <h3>Task Details Interval</h3>
        </div>
        
        <div className="intervals-list">
          <div className="interval-card">
            <div className="interval-header">
              <h4>Task Activity Details</h4>
              {hasUnsavedChanges && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm" onClick={saveAllIntervals}>
                    Save Changes
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={discardChanges}>
                    Discard
                  </button>
                </div>
              )}
            </div>
            
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label htmlFor="details-task-select">Select Task:</label>
                <select
                  id="details-task-select"
                  value={selectedDetailsTaskId || ''}
                  onChange={(e) => setSelectedDetailsTaskId(e.target.value ? Number(e.target.value) : null)}
                  className="datetime-input"
                >
                  <option value="">Select a task</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.name ?? 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="date-input-group">
                <label htmlFor="details-interval-start">Start:</label>
                <input
                  id="details-interval-start"
                  type="datetime-local"
                  value={detailsInterval.start}
                  onChange={(e) => updateDetailsInterval('start', e.target.value)}
                  className="datetime-input"
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="details-interval-end">End:</label>
                <input
                  id="details-interval-end"
                  type="datetime-local"
                  value={detailsInterval.end}
                  onChange={(e) => updateDetailsInterval('end', e.target.value)}
                  className="datetime-input"
                />
              </div>
            </div>
            
            {selectedDetailsTaskId && (
              <div className="interval-stats">
                <div className="intervals-header">
                  <h4>Activity Intervals ({editableIntervals.length})</h4>
                  <button className="btn btn-sm" onClick={addNewInterval}>
                    + Add Interval
                  </button>
                </div>

                {overlappingIntervalIds.size > 0 && (
                  <div className="overlap-warning">
                    ⚠ Warning: Some intervals overlap. Overlapping intervals are highlighted in red.
                  </div>
                )}

                {editableIntervals.length === 0 ? (
                  <div className="tile empty">
                    No activity intervals found for the selected period
                  </div>
                ) : (
                  <div className="activity-intervals-list">
                    {editableIntervals.map((interval, index) => {
                      const hasOverlap = overlappingIntervalIds.has(interval.id)
                      return (
                        <div 
                          className={`activity-interval-item editable ${hasOverlap ? 'overlap' : ''}`} 
                          key={interval.id}
                        >
                          <div className="interval-edit-header">
                            <span className="interval-number">Interval {index + 1}</span>
                            <button 
                              className="btn-icon btn-delete" 
                              onClick={() => removeInterval(interval.id)}
                              aria-label="Remove interval"
                            >
                              ×
                            </button>
                          </div>
                          <div className="interval-time-range">
                            <div className="time-edit-group">
                              <label>Start:</label>
                              <input
                                type="datetime-local"
                                value={formatDateTimeForInput(interval.start)}
                                onChange={(e) => updateIntervalTime(interval.id, 'start', e.target.value)}
                                className="datetime-input"
                              />
                            </div>
                            {!interval.isOngoing && (
                              <div className="time-edit-group">
                                <label>End:</label>
                                <input
                                  type="datetime-local"
                                  value={formatDateTimeForInput(interval.end)}
                                  onChange={(e) => updateIntervalTime(interval.id, 'end', e.target.value)}
                                  className="datetime-input"
                                />
                              </div>
                            )}
                            {interval.isOngoing && (
                              <div className="time-label ongoing">
                                <span className="label">Status:</span>
                                <span className="time-value">Ongoing</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="daily-activity-section">
        <h3>Daily Activity Chart</h3>
        
        <div className="chart-controls">
          <div className="date-input-group">
            <label htmlFor="task-select">Select Task:</label>
            <select
              id="task-select"
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
              className="datetime-input"
            >
              <option value="">Select a task</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name ?? 'Untitled'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="date-input-group">
            <label htmlFor="chart-start">Start Date:</label>
            <input
              id="chart-start"
              type="date"
              value={chartStartDate}
              onChange={(e) => setChartStartDate(e.target.value)}
              className="datetime-input"
            />
          </div>
          
          <div className="date-input-group">
            <label htmlFor="chart-end">End Date:</label>
            <input
              id="chart-end"
              type="date"
              value={chartEndDate}
              onChange={(e) => setChartEndDate(e.target.value)}
              className="datetime-input"
            />
          </div>
        </div>
        
        {selectedTaskId && chartData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.8)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(36, 36, 36, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="minutes" fill="#646cff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-placeholder">
            {!selectedTaskId 
              ? 'Please select a task to view daily activity' 
              : 'No activity data for the selected period'}
          </div>
        )}
      </div>
      
      {error && <div className="error">{error}</div>}
    </div>
  )
}

function Info() {
  return (
    <div className="box">
      <h2>App Info</h2>
      <h3>App creator</h3>
      <p>Alexander Pakkanen</p>
      <h3>How to use the app</h3>
      <h4>Homepage</h4>
      <p>When on the homepage of the app, tasks appear as tiles with smaller checkbox tiles that contain the created tags for
        that task. The tasks can be toggled for each individual task by clicking the tag itself. 
        <p>To delete a task, click the "×" button in the top right corner of the task tile.
        For adding tasks simply write the name of the task into the input box at the top of the screen and click "Add Task".</p>
        <p>To edit the name of an existing task, click the pen icon next to the close button, input the new name of the task into the input box and click save.
          To cancel the edit, simply press cancel.
        </p>
      </p>
      <h4>Statistics Page</h4>
      <p>The statistics page contains many different methods of fetching task and tag time data, such as the time intervals for when 
        tasks and tags were active, as well as a daily activity chart for individual tasks. It also contains a bar chart that shows the daily activity of the selected task.
        The usage of these features is mostly self-explanatory, each feature contains a start and end time selector, and displays the data for the selected time interval.
        In the case of the Task Activity Details, you are also able to edit the activity intervals manually by using the date selectors within each interval. There is also a delete button for removing intervals, which is located in the tile that displays the interval details.
      </p>
      <h3>Info on the usage of AI in the app</h3>
      <p>LLMs were used to make corrections to syntax and check for errors within the code, as well as for some styling properties for the app, but the final code within the app was written and checked by the creator (me).</p>
    </div>
  )
}

export default App;