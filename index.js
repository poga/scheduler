/* globals prompt */
const vis = require('vis')
const moment = require('moment')
const yo = require('yo-yo')
const extend = require('xtend')

// DOM element where the Timeline will be attached
var container = document.getElementById('vis')

const today = moment().startOf('day')

// Create a DataSet (allows two way data-binding)
var items = new vis.DataSet([
  { id: 1, content: 'item 1', start: today.clone(), end: today.clone().add(1, 'day'), owner: 'foo' },
  { id: 2, itemType: 'step', content: 'Step 1', start: today.clone().add(1, 'day'), style: 'background-color: grey; border: none; color: white' },
  { id: 4, content: 'item 4', start: today.clone().add(2, 'day'), end: today.clone().add(4, 'day') }
])
window.items = items

// Configuration for the Timeline
var options = {
  editable: true,
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
    item.end = moment(item.start).add(1, 'day'); cb(item)
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
  snap: (date, scale, step) => {
    // snap to start of a day
    return moment(date).startOf('day')
  }
}

// Create a Timeline
var timeline = new vis.Timeline(container, items, options)

const view = () => {
  return yo`
    <div class="pa4" id="table">
      <div class="overflow-auto">
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
      return x.itemType !== 'step'
    }

    return moment(x.start).isAfter(moment(y.start))
  }
}

const tbody = (items) => {
  const styles = ['bg-white', 'bg-black-10']
  var currentStyle = 0
  console.log(items)

  var views = []
  items.forEach((item, i) => {
    if (item.itemType === 'step') {
      currentStyle = (currentStyle + 1) % styles.length
      return
    }

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
      <td class="pa2"><input class="bn-l bg-transparent" type="text" value="${item.owner || ''}" onkeyup=${updateHandler(item, 'owner')}/></td>
    </tr>
  `

  function formatDate (date) {
    return moment(date).format('YYYY.MM.DD')
  }

  function updateHandler (item, attr) {
    return (e) => {
      var update = {}
      update[attr] = e.target.value
      items.update(extend(item, update))
      console.log(items)
      render()
    }
  }
}

function render () {
  yo.update(document.querySelector('#table'), view())
}

render()
