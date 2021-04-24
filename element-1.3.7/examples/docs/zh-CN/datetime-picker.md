<script>
  module.exports = {
    data() {
      return {
        pickerOptions2: {
          shortcuts: [{
            text: '最近一周',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit('pick', [start, end]);
            }
          }]
        },
        value1: '',
        value2: '',
        value3: [new Date(2000, 10, 10, 10, 10), new Date(2000, 10, 11, 10, 10)],
        value4: '',
        value5: '',
        value6: '',
        value7: '',
        value8: '',
        value9: '',
        value10: '',
        value11: '',
        value12: '',
        value13: '',
        value14: '',
        value15: '',
        value16: ''
      };
    },
    watch: {
    },
    created(){
      this.value4 = [new Date("2021-01-24 19:04:41"), new Date("2021-04-24 19:04:41")]
    },
    mounted(){
      // datapicker 初始化时手动触发 input 事件
      // console.log(this.$refs.datepicker)
      this.$nextTick(()=> {
        this.$refs.datepicker.$emit("input", this.value4)
      })
    },
    methods:{
      inputinput(...args){
        console.log(args)
        args[0].forEach(time => {
          console.log(time.toLocaleDateString())
        })
        // console.log(this.$refs.datepicker.$refs.reference)
        // console.log(this.$refs.datepicker.reference.querySelector('input'))

        // console.log(this.$refs.datepicker.reference.querySelector('input').value)

// datapicker 组件内部有input事件，通过input事件在下一个DOM 更新周期获取选择的value值，再对value值进行更改
/**
 * 打开的文件包括
 *    examples\docs\zh-CN\datetime-picker.md
 * packages\date-picker\index.js
 * packages\date-picker\src\picker\date-picker.js
 * packages\date-picker\src\picker.vue
 * packages\date-picker\src\panel\date-range.vue
 * 
 * packages\input\index.js
 * packages\input\src\input.vue
*/
// debugger
        this.$nextTick(()=> {
          // debugger
          let input = this.$refs.datepicker.reference.querySelector('input')
          let value = input.value
          console.log(value)
          let textArr = value.split(' - ')
          if(textArr[0].slice(0,10) === '2021-01-24'){
            input.value = '最近三个月'
          }
          this.$nextTick(()=> {
            // debugger
          })
        })
        // let input = this.$refs.datepicker.reference.querySelector('input')
        // Object.defineProperty(input, 'value', {
        //   set(val){
            
        //   }
        // })


        // this.$refs.datepicker.reference.querySelector('input').addEventListener('input', (event) => {
        //   debugger
        // })
        // this.value4 = 123123123
        // console.log(this.$refs.datepicker)
        // this.$refs.datepicker.displayValue = 2131
        // debugger
      }
    }
  };
</script>

<style>
.demo-block.demo-datetime-picker .source {
    padding: 0;
    display: flex;
  }

  .demo-datetime-picker .block {
    padding: 30px 0;
    text-align: center;
    border-right: solid 1px #EFF2F6;
    flex: 1;
    &:last-child {
      border-right: none;
    }
  }

  .demo-datetime-picker .demonstration {
    display: block;
    color: #8492a6;
    font-size: 14px;
    margin-bottom: 20px;
  }
</style>

### 日期和时间范围

:::demo 设置`type`为`datetimerange`即可选择日期和时间范围
```html
<template>
  <div class="block">
    <span class="demonstration">带快捷选项</span>
    <el-date-picker
      v-model="value4"
      type="datetimerange"
      :picker-options="pickerOptions2"
      placeholder="选择时间范围"
      @input="inputinput"
      align="right"
      ref="datepicker">
    </el-date-picker>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        pickerOptions2: {
          shortcuts: [{
            text: '最近一周',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit('pick', [start, end]);
            }
          }]
        },
        value3: [new Date(2000, 10, 10, 10, 10), new Date(2000, 10, 11, 10, 10)],
        value4: ''
      };
    },
  };
</script>
```
:::
