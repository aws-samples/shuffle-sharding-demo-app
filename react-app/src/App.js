import './App.css';
import Instance from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Compute/Res_48_Light/Res_Amazon-EC2_Instance_48_Light.svg';
import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import cloudfrontFunction from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Functions_48_Dark.svg';
import user from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg';
import loadbalancer from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Elastic-Load-Balancing_Network-Load-Balancer_48_Dark.svg';
import Cloudfront from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Download-Distribution_48_Dark.svg';
import Xarrow from 'react-xarrows';

const ec2 = [
  {
    name: 'Worker 1',
    selected: false,
  },
  {
    name: 'Worker 2',
    selected: true,
  },
];

function App() {
  const [totalReactPackages, setTotalReactPackages] = useState(null);

  useEffect(() => {
    // GET request using fetch inside useEffect React hook
    fetch('https://api.npms.io/v2/search?q=react')
      .then((response) => response.json())
      .then((data) => setTotalReactPackages(data.total));

    // empty dependency array means this effect will only run once (like componentDidMount in classes)
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img id="user" src={user}></img>
        <Xarrow
          start="user"
          end="tg4"
          lineColor="Coral"
          headColor="Coral"
          // animateDrawing="10"
          labels={{
            middle: (
              <div
                style={{
                  fontSize: '15px',
                  fontStyle: 'italic',
                }}
              >
                key = /banana
              </div>
            ),
          }}
          path="straight"
          headShape={'arrow1'}
          dashness={{ animation: true, strokeLen: 20, nonStrokeLen: 10 }}
          headSize="8"
          showHead="true"
        />
        <br></br>
        <Box
          component="span"
          style={{ position: 'relative', fontSize: 15, padding: 20 }}
          sx={{ p: 2, border: `1px dashed white` }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontSize: 15,
            }}
          >
            Edge Location
          </div>
          <br></br>
          <div id="cff">
            <img src={cloudfrontFunction}></img>
            <br></br>
            CloudFront <br></br> Function
          </div>
          <br></br>
          <div>
            <img src={Cloudfront}></img>
            <br></br>
            Amazon <br></br>CloudFront
          </div>
        </Box>
        <br></br>
        <SectionComponent title="AWS Region" color="white" />
        <br></br>
      </header>
    </div>
  );
}

function SectionComponent(props) {
  const box = (
    <Box
      component="span"
      style={{ position: 'relative', fontSize: 15, padding: 30 }}
      sx={{ p: 2, border: `1px dashed ${props.color}` }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          fontSize: 15,
        }}
      >
        {props.title}
      </div>
      <div>
        <img src={loadbalancer}></img> <br></br>
        Application <br></br>loadbalancer
      </div>
      <br></br>
      <div>
        <table>
          <tr>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 1" />
            </td>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 2" />
            </td>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 3" />
            </td>
            <td id="tg4" style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 4" />
            </td>
          </tr>
          <tr>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 1" />
            </td>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 2" />
            </td>
            <td style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 3" />
            </td>
            <td id="tg4" style={{ padding: 10 }}>
              <TargetGroup data={ec2} title="Target Group 4" />
            </td>
          </tr>
        </table>
      </div>
    </Box>
  );
  return box;
}

function TargetGroup(props) {
  const data = props.data;
  const cell_title = props.title;
  const tgcell = (
    <Box
      style={{ position: 'relative', fontSize: 15, padding: 10 }}
      sx={{ p: 2, border: `1px dashed white` }}
    >
      <table>
        <tr>
          <td>
            <img src={Instance}></img>
            <br></br>
            {data[0].name}
          </td>
          <td>
            <img src={Instance}></img>
            <br></br>
            {data[1].name}
          </td>
        </tr>
      </table>
    </Box>
  );

  return (
    <div style={{ fontSize: 15 }}>
      {tgcell}
      {cell_title}
    </div>
  );
}
export default App;