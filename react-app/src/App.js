import './App.css';
import Instance from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Compute/Res_48_Light/Res_Amazon-EC2_Instance_48_Light.svg';
import React, { useState, useEffect } from 'react';
// import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import cloudfrontFunction from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Functions_48_Dark.svg';
import user from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg';
import loadbalancer from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Elastic-Load-Balancing_Network-Load-Balancer_48_Dark.svg';
import Cloudfront from 'aws-svg-icons/lib/Resource-Icons_07302021/Res_Networking-and-Content-Delivery/Res_48_Dark/Res_Amazon-CloudFront_Download-Distribution_48_Dark.svg';
import Xarrow from 'react-xarrows';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <br></br>
        <Box
          component="span"
          style={{ position: 'relative', fontSize: 15, padding: 20 }}
          sx={{ p: 2, border: `1px dashed white` }}
        >
          <SectionDetails></SectionDetails>
        </Box>
        <br></br>
        <br></br>
        <img id="user" src={user}></img>
        <br></br>
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
        <b>Hello from {workstation_id} !</b> <br></br>
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
          <td style={{ padding: 10 }}>
            <TargetGroup
              data={shard}
              title={'Target Group ' + humenIndex}
              selected="true"
              instance_name={workstation_id}
            />
          </td>
        );
      } else {
        cols.push(
          <td style={{ padding: 10 }}>
            <TargetGroup data={shard} title={'Target Group ' + humenIndex} />
          </td>
        );
      }
    });
    cols.push(
      <Xarrow
        start="user"
        end="selectedtg"
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
        dashness={{ animation: true, strokeLen: 20, nonStrokeLen: 10 }}
        headSize="8"
        showHead="true"
      />
    );
    setColumns(cols);
  }, []);
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
          <tr>{columns}</tr>
        </table>
      </div>
    </Box>
  );
  return box;
}

function TargetGroup(props) {
  const data = props.data;
  const cell_title = props.title;
  var tgcell = <></>;
  if (props.selected) {
    tgcell = (
      <Box
        style={{ position: 'relative', fontSize: 15, padding: 10 }}
        sx={{ p: 2, border: `1px dashed red` }}
      >
        <table>
          <tr id="selectedtg">
            <td id={data[0]}>
              <img src={Instance}></img>
              <br></br>
              {props.instance_name == data[0] ? (
                <b>{data[0]}</b>
              ) : (
                <>{data[0]}</>
              )}
            </td>
            {data.length > 1 ? (
              <td id={data[1]}>
                <img src={Instance}></img>
                <br></br>
                {props.instance_name == data[1] ? (
                  <b>{data[1]}</b>
                ) : (
                  <>{data[1]}</>
                )}
              </td>
            ) : (
              <p></p>
            )}
          </tr>
        </table>
      </Box>
    );
  } else {
    tgcell = (
      <Box
        style={{ position: 'relative', fontSize: 15, padding: 10 }}
        sx={{ p: 2, border: `1px dashed white` }}
      >
        <table>
          <tr>
            <td>
              <img src={Instance}></img>
              <br></br>
              {data[0]}
            </td>
            {data.length > 1 ? (
              <td id={data[1]}>
                <img src={Instance}></img>
                <br></br>
                {data[1]}
              </td>
            ) : (
              <p></p>
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
