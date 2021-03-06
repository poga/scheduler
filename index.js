/* globals prompt, localStorage */
const vis = require('vis')
const moment = require('moment')
const yo = require('yo-yo')

// DOM element where the Timeline will be attached
var container = document.getElementById('vis')

const today = moment().startOf('day')

const GROUP_STEP_ID = 1
const GROUP_ITEM_ID = 2

const groups = [
  { id: GROUP_STEP_ID, content: 'step' },
  { id: GROUP_ITEM_ID, content: 'item' }
]

const stepStyle = 'background-color: grey; border: none; color: white'

// Create a DataSet (allows two way data-binding)
var items = loadItems()
window.items = items

// Configuration for the Timeline
var options = {
  editable: {
    add: true,
    updateTime: true,
    remove: true
  },
  multiselect: true,
  timeAxis: { scale: 'day' },
  format: {
    majorLabels: {
      day: 'YYYY/MM'
    },
    minorLabels: {
      day: 'MM/DD ddd'
    }
  },
  minHeight: 200,
  horizontalScroll: true,
  zoomKey: 'ctrlKey',
  start: today.clone().startOf('week'),
  onAdd: (item, cb) => {
    if (item.group === GROUP_STEP_ID) {
      item.content = '新階段'
      item.style = stepStyle
    } else {
      item.end = moment(item.start).add(1, 'day')
      item.content = '新工作項目'
    }

    item.owner = undefined
    cb(item)
    render()
  },
  onUpdate: (item, cb) => {
    item.content = prompt('Edit items text:', item.content)
    if (item.content != null) {
      cb(item) // send back adjusted item
    } else {
      cb(null) // cancel updating the item
    }
    render()
  },
  onMove: (item, cb) => {
    cb(item)
    render()
  },
  onRemove: (item, cb) => {
    cb(item)
    render()
  },
  snap: (date, scale, step) => {
    // snap to start of a day
    return moment(date).startOf('day')
  }
}

// Create a Timeline
var timeline = new vis.Timeline(container, items, options)
timeline.setGroups(groups)

const tableView = () => {
  return yo`
    <div class="mw8 center w-100 pl4 pr4" id="table">
      <div class="mt5 overflow-auto">
        <table class="f6 w-100 mw8 center" cellspacing="0">
          <thead>
            <tr class="bg-black-40 white-90">
              <th class="fw6 tl pa2">日期</th>
              <th class="fw6 tl pa2">工作項目</th>
              <th class="fw6 tl pa2">負責對象</th>
            </tr>
          </thead>
          ${tbody(items.get({order: sortItem}))}
        </table>
      </div>
    </div>
  `

  function sortItem (x, y) {
    var tx = moment(x.start)
    var ty = moment(y.start)
    // 如果兩個 item 時間一樣，把 step 放前面
    if (tx.isSame(ty)) {
      return x.group > y.group
    }

    return moment(x.start).isAfter(moment(y.start))
  }
}

const tbody = (items) => {
  const styles = ['bg-white', 'bg-black-10']
  var currentStyle = 0
  var styleRendered = false
  console.log(items)

  var views = []
  items.forEach((item, i) => {
    if (item.group === GROUP_STEP_ID) {
      if (styleRendered) {
        currentStyle = (currentStyle + 1) % styles.length
        styleRendered = false
      }
      return
    }

    styleRendered = true
    views.push(itemView(item, i, styles[currentStyle]))
  })

  return yo`
    <tbody class="lh-copy">
      ${views}
    </tbody>
  `
}

const itemView = (item, i, style) => {
  return yo`
    <tr class="${style}">
      <td class="pa2">${formatDate(item.start)} - ${formatDate(item.end)}</td>
      <td class="pa2"><input class="bn-l bg-transparent" type="text" value="${item.content}" onkeyup=${updateHandler(item, 'content')}/></td>
      <td class="pa2"><input class="bn-l bg-transparent" type="text" value="${item.owner || ' '}" onkeyup=${updateHandler(item, 'owner')}/></td>
    </tr>
  `

  function formatDate (date) {
    return moment(date).format('MM.DD')
  }

  function updateHandler (item, attr) {
    return (e) => {
      item[attr] = e.target.value
      items.update(item)
      render()
    }
  }
}

function render () {
  yo.update(document.querySelector('#table'), tableView())
  saveItems()
}

render()

function loadItems () {
  var data = localStorage.getItem('data')
  var items
  if (!data) {
    items = new vis.DataSet(
      [
        { id: 1, group: GROUP_ITEM_ID, content: 'item 1', start: today.clone(), end: today.clone().add(1, 'day'), owner: 'foo' },
        { id: 2, group: GROUP_STEP_ID, content: 'Step 1', start: today.clone().add(1, 'day'), style: stepStyle }
      ]
   )
  } else {
    items = new vis.DataSet(JSON.parse(data))
  }

  return items
}

function saveItems () {
  localStorage.setItem('data', JSON.stringify(items.get()))
}
