import './App.css';
import React, { useState, useEffect } from 'react';
// import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import cloudfrontFunction from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Functions_48_Dark.svg';
import loadbalancer from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Elastic-Load-Balancing_Network-Load-Balancer_48_Dark.svg';
import Cloudfront from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Download-Distribution_48_Dark.svg';
import Xarrow from 'react-xarrows';
import { grey } from '@mui/material/colors';
import { Grid } from '@mui/material';

function Instance(props) {
  return (
    <svg width="48px" height="48px" viewBox="0 0 48 48">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path
          d="M9,39 L39,39 L39,9 L9,9 L9,39 Z M46,13 L46,11 L41,11 L41,8 C41,7.448 40.552,7 40,7 L37,7 L37,2 L35,2 L35,7 L31,7 L31,2 L29,2 L29,7 L25,7 L25,2 L23,2 L23,7 L19,7 L19,2 L17,2 L17,7 L13,7 L13,2 L11,2 L11,7 L8,7 C7.447,7 7,7.448 7,8 L7,11 L2,11 L2,13 L7,13 L7,17 L2,17 L2,19 L7,19 L7,23 L2,23 L2,25 L7,25 L7,29 L2,29 L2,31 L7,31 L7,35 L2,35 L2,37 L7,37 L7,40 C7,40.553 7.447,41 8,41 L11,41 L11,46 L13,46 L13,41 L17,41 L17,46 L19,46 L19,41 L23,41 L23,46 L25,46 L25,41 L29,41 L29,46 L31,46 L31,41 L35,41 L35,46 L37,46 L37,41 L40,41 C40.552,41 41,40.553 41,40 L41,37 L46,37 L46,35 L41,35 L41,31 L46,31 L46,29 L41,29 L41,25 L46,25 L46,23 L41,23 L41,19 L46,19 L46,17 L41,17 L41,13 L46,13 Z"
          id="Amazon-EC2-Instance_Resource-Icon_light-bg"
          fill="currentColor"
          {...props}
        ></path>
      </g>
    </svg>
  );
}

function User() {
  return (
    <svg width="48x" height="48px" viewBox="0 0 48 48">
      <g
        xmlns="http://www.w3.org/2000/svg"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <path
          d="M6.025,44 C6.524,34.085 14.395,26.178 24,26.178 C27.248,26.178 30.43,27.092 33.205,28.822 C38.354,32.033 41.653,37.783 41.974,44 L6.025,44 Z M14.192,13.878 C14.192,8.432 18.592,4 24.001,4 C29.408,4 33.807,8.432 33.807,13.878 C33.807,19.325 29.408,23.757 24.001,23.757 C18.592,23.757 14.192,19.325 14.192,13.878 L14.192,13.878 Z M34.263,27.125 C32.53,26.044 30.65,25.26 28.698,24.771 C32.877,22.939 35.807,18.749 35.807,13.878 C35.807,7.329 30.51,2 24.001,2 C17.489,2 12.192,7.329 12.192,13.878 C12.192,18.755 15.13,22.95 19.317,24.778 C10.545,26.981 4,35.2 4,45 C4,45.552 4.447,46 5,46 L43,46 C43.552,46 44,45.552 44,45 C44,37.719 40.269,30.87 34.263,27.125 L34.263,27.125 Z"
          id="Fill-1"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <br></br>
        <Box
          component="span"
          m={5}
          style={{ position: 'relative', fontSize: 15, padding: 20 }}
          sx={{ p: 2, border: `1px dashed white` }}
        >
          <SectionDetails></SectionDetails>
        </Box>
        <br></br>
        <br></br>
        <button
          style={{
            backgroundColor: grey.A700,
            fontSize: 18,
            height: 40,
            color: 'white',
          }}
          onClick={() => {
            window.location = window.location.href.split('?')[0];
          }}
        >
          Click to get new key
        </button>
        <br></br>
        <br></br>
        <div id="user">{User()}</div>
        <br></br>
        <br></br>
        <Box
          component="span"
          m={5}
          p={20}
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

function SectionDetails() {
  const [columns, setColumns] = useState([]);
  let workstation_id = window.token.instance_name.split('/')[1];
  let number_of_target_groups = window.token.targetgroupsSize;
  let my_target_group_id = window.token.keyvalue;
  let number_of_vms = window.token.number_of_vms;
  let cols = [];
  useEffect(() => {
    cols.push(
      <p>
        {' '}
        <h1>Hello from {workstation_id} !</h1> <br></br>
        <br></br>
        You are assigned to virtual target group number {my_target_group_id}
        <br></br>There are total of {number_of_target_groups} target groups ,
        running on {number_of_vms} Amazon EC2 Instances
      </p>
    );
    setColumns(cols);
  });
  const box = <div>{columns}</div>;
  return box;
}

function SectionComponent(props) {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    console.log(window.token);
    let workstation_id = window.token.instance_name.split('/')[1];
    let mode = window.token.mode;
    let my_target_group_id = window.token.keyvalue;
    let number_of_vms = window.token.number_of_vms;
    let cols = [];
    let ec2list = [];

    for (let a = 1; a < number_of_vms + 1; a++) {
      ec2list.push('Worker' + a);
    }
    let array_of_tg = [];

    switch (mode) {
      case 1: // no group no shuffle
        for (let a = 0; a < number_of_vms; a++) {
          console.log('newGroup', a);
          array_of_tg.push([ec2list[a]]);
        }
        break;
      case 2: // group enabled
        for (let a = 0; a < number_of_vms; a = a + 2) {
          console.log('newGroup', a, a + 1);
          array_of_tg.push([ec2list[a], ec2list[a + 1]]);
        }
        break;
      case 3: // shuffle enabled
        for (let a = 0; a < number_of_vms; a++) {
          for (let b = a + 1; b < number_of_vms; b++) {
            console.log('newGroup', a, b);
            array_of_tg.push([ec2list[a], ec2list[b]]);
          }
        }
        break;
      default:
        break;
    }
    console.log(array_of_tg);
    array_of_tg.forEach((shard, index) => {
      let humenIndex = index + 1;
      if (humenIndex == my_target_group_id) {
        cols.push(
          <Grid
            item
            xs={mode == 1 ? 4 : 6} // three boxes in mode 1, two box in mode2,3
            md={mode == 2 ? 6 : 4} // three boxes in all
          >
            <TargetGroup
              data={shard}
              title={'Target Group ' + humenIndex}
              selected="true"
              instance_name={workstation_id}
            />
          </Grid>
        );
      } else {
        cols.push(
          <Grid
            item
            xs={mode == 1 ? 4 : 6} // three boxes in mode 1, two box in mode2,3
            md={mode == 2 ? 6 : 4} // three boxes in all
          >
            <TargetGroup data={shard} title={'Target Group ' + humenIndex} />
          </Grid>
        );
      }
    });
    setColumns(cols);
  }, []);
  const box = (
    <Box
      m={5}
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
        <Grid container spacing={5} justifyContent="center" alignItems="center">
          {columns}
        </Grid>
        {/* add if to render two lines */}
      </div>
    </Box>
  );
  return box;
}

function namesToColors(name) {
  const colors = [
    'SkyBlue',
    'Brown',
    'LimeGreen',
    'Chocolate',
    'Violet',
    'Snow',
    'SlateBlue',
    'Red',
    'RebeccaPurple',
    'Peru',
    'MistyRose',
    'Magenta',
  ];
  const number = parseInt(name.split('Worker')[1]);
  if (number > 0 && number < colors.length) return colors[number - 1];
  else return colors[0];
}

function TargetGroup(props) {
  const data = props.data;
  const cell_title = props.title;
  var tgcell = <></>;
  if (props.selected) {
    tgcell = (
      <Box
        style={{
          position: 'relative',
          fontSize: 15,
          padding: 10,
          display: 'flex',
          justifyContent: 'center',
        }}
        sx={{ p: 2, border: `1px dashed red` }}
      >
        <table>
          <tr id="selectedtg">
            <td id={data[0]} style={{ padding: 5 }}>
              <i style={{ color: namesToColors(data[0]) }}>
                <Instance id="selectedInstance"></Instance>
                <Xarrow
                  start="user"
                  end="selectedInstance"
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
                        /?{window.token.keyname}={window.token.keyvalue}
                      </div>
                    ),
                  }}
                  path="straight"
                  headShape={'arrow1'}
                  dashness={{
                    animation: true,
                    strokeLen: 20,
                    nonStrokeLen: 10,
                  }}
                  headSize="8"
                  showHead="true"
                />
              </i>

              <br></br>
              {props.instance_name == data[0] ? (
                <b>{data[0]}</b>
              ) : (
                <>{data[0]}</>
              )}
            </td>
            {data.length > 1 ? (
              <td id={data[1]} style={{ padding: 5 }}>
                <i style={{ color: namesToColors(data[1]) }}>
                  <Instance></Instance>
                </i>
                <br></br>
                {props.instance_name == data[1] ? (
                  <b>{data[1]}</b>
                ) : (
                  <>{data[1]}</>
                )}
              </td>
            ) : (
              <b></b>
            )}
          </tr>
        </table>
      </Box>
    );
  } else {
    tgcell = (
      <Box
        style={{
          position: 'relative',
          fontSize: 15,
          padding: 10,
          display: 'flex',
          justifyContent: 'center',
        }}
        sx={{ p: 2, border: `1px dashed white` }}
      >
        <table>
          <tr>
            <td style={{ padding: 5 }}>
              <i style={{ color: namesToColors(data[0]) }}>
                <Instance></Instance>
              </i>
              <br></br>
              {data[0]}
            </td>
            {data.length > 1 ? (
              <td id={data[1]} style={{ padding: 5 }}>
                <i style={{ color: namesToColors(data[1]) }}>
                  <Instance></Instance>
                </i>
                <br></br>
                {data[1]}
              </td>
            ) : (
              <b></b>
            )}
          </tr>
        </table>
      </Box>
    );
  }
  return (
    <div style={{ fontSize: 15 }}>
      {tgcell}
      {cell_title}
    </div>
  );
}
export default App;
