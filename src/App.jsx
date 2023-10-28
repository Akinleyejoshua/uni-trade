import { useEffect, useState } from 'react'
import './App.css'
import { api2, connection } from "./deriv";
import { SiBitcoin, SiRobotframework } from "react-icons/si"
import { request } from "./axios";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { AiOutlineArrowDown, AiOutlineArrowUp, AiOutlineDollarCircle } from "react-icons/ai"

function App() {
  const date = new Date();
  const [state, setState] = useState({
    tick: 0,
    pip: 0,
    tickH: {},
    symbol: "",
    tickSymbol: "",
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate() + 1,
    hr: 0,
    min: 0,
    tp: 0,
    price: 0,
    sl: 0,
    order: "neutral",
  })

  const handleState = (name, val) => {
    setState(prevState => ({
      ...prevState,
      [name]: val
    }))
  }

  const tickStream = () => api2.subscribe({ ticks: state.tickSymbol })
  const tickH = () => api2.subscribe({
    ticks_history: state.tickSymbol,
    adjust_start_time: 1,
    end: 'latest',
    start: 1,
    style: 'ticks',
  })


  const streamTicks = async () => {
    await tickStream()
    await tickH();
    await tickStream().subscribe();
    await api2.connect(1)
  }

  connection.onmessage = (res) => {
    const data = JSON.parse(res.data);
    if (data.error?.code === "MarketIsClosed") {
      tickStream().unsubscribe();
      api2.disconnect();
      handleState("tick", undefined)
    }

    if (data.msg_type === "tick") {
      // console.log(data)
      handleState("tick", data.tick?.quote)
      handleState("pip", data.tick?.pip_size)
    } else {
      handleState("tickH", data.history)
      // console.log(data)
    }
  }

  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [selectSymbol, setSelectSymbol] = useState("Select Symbol");

  const forecast = async () => {
    const { symbol, year, month, day, hr, min, tick } = state;
    const req = await request.get(`/api/forecast?symbol=${symbol}&year=${year}&month=${month}&day=${day}&hours=${hr}&minutes=${min}&sec=00`);
    const data = req.data;
    const price = data.price;
    if (price !== 0) {
      const tp = parseFloat(price) + (100 * state.pip)
      const sl = price - (100 * state.pip)
      handleState("price", price)
      handleState("tp", tp)
      handleState("sl", sl)
      if (tick > tp) {
        handleState("order", "sell")
      } else {
        handleState("order", "buy")

      }
    } else {
      handleState("symbol", "")
      alert("Symbol not available for forecast")
    }

  }

  useEffect(() => {
    streamTicks()
  }, [state.symbol])

  return (
    <>
      <header>
        <div className="nav-brand">
          <a href="/">UNI-TRADE</a>
        </div>
      </header>
      <div className="space"></div>
      <main>
        <h1>Select Symbol</h1>
        <div className="space"></div>
        <div className="row">
          <div className={`${toggleDropdown ? "dropdown col visible" : "dropdown col"}`}>
            <div className='title' onClick={() => setToggleDropdown(!toggleDropdown)}>{selectSymbol}</div>
            <div className={`${toggleDropdown ? "panel col slide-out" : "panel col slide-in"}`}>
              {[
                { name: "BTC vs USD", tickSymbol: "cryBTCUSD", symbol: "BTCUSD", icon: <SiBitcoin className='icon' /> },
                { name: "GBP vs USD", tickSymbol: "frxGBPUSD", symbol: "GBPUSD", icon: <AiOutlineDollarCircle className='icon' /> }

              ].map((item, i) => {
                return <button className='row' key={i} onClick={() => {
                  setToggleDropdown(false)
                  handleState("symbol", item.symbol);
                  handleState("tickSymbol", item.tickSymbol);
                  setSelectSymbol(item.name);
                  streamTicks();
                }}>
                  <p>{item.name}</p>
                  <div className="space"></div>
                  {item.icon}
                </button>
              })}
            </div>
          </div>
        </div>
        <div className="space"></div>
        <h1>Select Timestamp</h1>
        <div className="space"></div>
        <div className="inputs row">
          <div className="input col">
            <small>Year</small>
            <div className="space"></div>
            <input type="text" value={state.year} className="year" placeholder='Year' onChange={e => handleState("year", e.target.value)} />
          </div>
          <div className="input col">
            <small>Month</small>
            <div className="space"></div>
            <input type="text" value={state.month} className="month" placeholder='Month' onChange={e => handleState("month", e.target.value)} />
          </div>
          <div className="input col">
            <small>Day</small>
            <div className="space"></div>
            <input type="text" value={state.day} className="day" placeholder='Day' onChange={e => handleState("day", e.target.value)} />

          </div>
          <div className="input col">
            <small>Hour</small>
            <div className="space"></div>
            <input type="text" value={state.hr} className="hr" placeholder='Hour' onChange={e => handleState("hr", e.target.value)} />

          </div>
          <div className="input col">
            <small>Minutes</small>
            <div className="space"></div>
            <input type="text" value={state.min} className="min" placeholder='Minutes' onChange={e => handleState("min", e.target.value)} />

          </div>
        </div>
        {
          state.symbol !== "" && <>
            <div className="space"></div>
            <div className="space"></div>
            <div className="space"></div>
            <div className="actions">
              <button className="forecast row" onClick={forecast}>
                <p>Forecast</p>
                <div className="space"></div>
                <SiRobotframework className='icon' />
              </button>
            </div>
            <div className="space"></div>
            <div className="space"></div>
            <div className="space"></div>
            <div className="grid prices">
              <div className="metric col">
                <div className="row val">
                  <small>current price</small>
                  <h2>{state.tick === undefined ? <small className='closed'>closed</small> : state.tick}</h2>
                </div>
                <FaMoneyBillTrendUp className='icon' />
              </div>
              <div className="metric col">
                <div className="row val">
                  <small>forcasting price</small>
                  <h2>{state.price}</h2>
                </div>
                <FaMoneyBillTrendUp className='icon' />
              </div>
              <div className="metric col">
                <div className="row val">
                  <small>take profit</small>
                  <h2>{state.tp}</h2>
                </div>
                <FaMoneyBillTrendUp className='icon' />
              </div>
              <div className="metric col">
                <div className="row val">
                  <small>stop loss</small>
                  <h2>{state.sl}</h2>
                </div>
                <FaMoneyBillTrendUp className='icon' />
              </div>

              {(state.order !== "neutral" && state.tick !== 0)
                &&
                <div className="metric col" id={`${state.order === "buy" ? "buy" : "sell"}`}>
                  <div className="row val">
                    <small>order now</small>
                    <h2>{state.order}</h2>
                  </div>
                  {state.order === "buy" ?
                    <AiOutlineArrowUp className='icon buy' />
                    :
                    <AiOutlineArrowDown className='icon sell' />
                  }
                </div>
              }

            </div>
          </>
        }


      </main>
    </>
  )
}

export default App
