import './App.css';
import React, { useState, useEffect } from 'react';
// import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Xarrow from 'react-xarrows';
import { grey, red } from '@mui/material/colors';
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

function cfd() {
  return (
    <svg width="48x" height="48px" viewBox="0 0 48 48">
      <g
        xmlns="http://www.w3.org/2000/svg"
        id="Icon-Resource/Networking-and-Content-Delivery/Res_AWS-Amazon-CloudFront_Download-Distribution_48"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <path
          d="M15.9581,27.6694 L17.3721,29.0834 L15.9581,30.4974 L14.5441,29.0834 L15.9581,27.6694 Z M18.8531,30.5644 L21.8131,33.5244 L20.3991,34.9394 L17.4381,31.9784 L18.8531,30.5644 Z M29.1501,30.5644 L30.5641,31.9784 L27.6041,34.9394 L26.1891,33.5244 L29.1501,30.5644 Z M32.0451,27.6694 L33.4591,29.0834 L32.0451,30.4974 L30.6311,29.0834 L32.0451,27.6694 Z M25.0011,35.2984 L26.1221,36.4194 L24.7081,37.8344 C24.5131,38.0294 24.2571,38.1274 24.0011,38.1274 C23.7451,38.1274 23.4891,38.0294 23.2941,37.8344 L21.8801,36.4194 L23.0011,35.2984 L23.0011,34.2524 L25.0011,34.2524 L25.0011,35.2984 Z M23.0011,16.4624 L25.0011,16.4624 L25.0011,12.9044 L23.0011,12.9044 L23.0011,16.4624 Z M23.0011,21.7994 L25.0011,21.7994 L25.0011,18.2414 L23.0011,18.2414 L23.0011,21.7994 Z M23.0011,27.1364 L25.0011,27.1364 L25.0011,23.5784 L23.0011,23.5784 L23.0011,27.1364 Z M23.0011,32.4734 L25.0011,32.4734 L25.0011,28.9154 L23.0011,28.9154 L23.0011,32.4734 Z M23.0011,11.1254 L25.0011,11.1254 L25.0011,9.1254 L23.0011,9.1254 L23.0011,11.1254 Z M24.0011,44.0024 C12.9731,44.0024 4.0001,35.0294 4.0001,24.0014 C4.0001,12.9724 12.9731,4.0004 24.0011,4.0004 C35.0291,4.0004 44.0021,12.9724 44.0021,24.0014 C44.0021,35.0294 35.0291,44.0024 24.0011,44.0024 L24.0011,44.0024 Z M24.0011,2.0004 C11.8691,2.0004 2.0001,11.8694 2.0001,24.0014 C2.0001,36.1324 11.8691,46.0024 24.0011,46.0024 C36.1331,46.0024 46.0021,36.1324 46.0021,24.0014 C46.0021,11.8694 36.1331,2.0004 24.0011,2.0004 L24.0011,2.0004 Z"
          id="AWS-Amazon-CloudFront_Download-distribution_Resource-Icon_light-bg"
          fill="#A166FF"
        />
      </g>
    </svg>
  );
}

function cff() {
  return (
    <svg width="48x" height="48px" viewBox="0 0 48 48">
      <g
        xmlns="http://www.w3.org/2000/svg"
        id="Icon-Resource/Networking-Content-Delivery/Res_Amazon-Cloudfront_Functions_48"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <path
          d="M31.9,33.508 C31.014,33.508 30.294,32.787 30.294,31.901 C30.294,31.015 31.014,30.294 31.9,30.294 C32.787,30.294 33.507,31.015 33.507,31.901 C33.507,32.787 32.787,33.508 31.9,33.508 L31.9,33.508 Z M31.9,28.294 C29.912,28.294 28.294,29.912 28.294,31.901 C28.294,33.89 29.912,35.508 31.9,35.508 C33.889,35.508 35.507,33.89 35.507,31.901 C35.507,29.912 33.889,28.294 31.9,28.294 L31.9,28.294 Z M15.782,24.103 C14.896,24.103 14.175,23.382 14.175,22.496 C14.175,21.61 14.896,20.889 15.782,20.889 C16.669,20.889 17.389,21.61 17.389,22.496 C17.389,23.382 16.669,24.103 15.782,24.103 L15.782,24.103 Z M15.782,18.889 C13.794,18.889 12.175,20.507 12.175,22.496 C12.175,24.485 13.794,26.103 15.782,26.103 C17.771,26.103 19.389,24.485 19.389,22.496 C19.389,20.507 17.771,18.889 15.782,18.889 L15.782,18.889 Z M25.779,10.666 C26.666,10.666 27.386,11.387 27.386,12.273 C27.386,13.159 26.666,13.88 25.779,13.88 C24.893,13.88 24.172,13.159 24.172,12.273 C24.172,11.387 24.893,10.666 25.779,10.666 L25.779,10.666 Z M25.779,15.88 C27.768,15.88 29.386,14.262 29.386,12.273 C29.386,10.284 27.768,8.666 25.779,8.666 C23.791,8.666 22.172,10.284 22.172,12.273 C22.172,14.262 23.791,15.88 25.779,15.88 L25.779,15.88 Z M18.853,19.116 L17.175,18.027 C18.521,15.953 19.676,14.578 21.164,13.281 L22.478,14.788 C21.141,15.954 20.09,17.208 18.853,19.116 L18.853,19.116 Z M29.203,28.173 L27.822,29.62 C25.246,27.162 22.675,25.547 19.732,24.537 L20.38,22.645 C23.607,23.753 26.41,25.509 29.203,28.173 L29.203,28.173 Z M29.274,15.12 C31.754,18.902 33.149,23.052 33.422,27.458 L31.426,27.582 C31.175,23.528 29.888,19.704 27.602,16.217 L29.274,15.12 Z M44,27.115 L41.572,26.977 C41.109,26.945 40.647,27.278 40.54,27.756 C40.117,29.63 39.38,31.409 38.351,33.043 C38.09,33.456 38.167,33.997 38.531,34.322 L40.344,35.94 L35.94,40.345 L35.161,39.472 C35.693,37.536 34.752,35.589 34.706,35.498 L32.915,36.389 C32.921,36.402 33.341,37.282 33.336,38.24 C33.236,38.265 33.137,38.3 33.046,38.358 C32.529,38.685 31.992,38.971 31.445,39.238 C31.796,38.383 32.107,37.512 32.357,36.647 L30.437,36.09 C30.026,37.507 29.449,38.948 28.772,40.275 C28.435,40.373 28.098,40.473 27.754,40.55 C27.277,40.658 26.948,41.095 26.976,41.583 L27.115,44 L20.884,44 L21.023,41.581 C21.051,41.093 20.722,40.656 20.246,40.549 C18.969,40.26 17.743,39.815 16.571,39.242 C15.488,36.464 14.865,33.484 14.865,31.003 C14.865,29.894 15.059,28.968 15.284,27.897 L15.45,27.088 L13.487,26.701 L13.326,27.486 C13.088,28.618 12.865,29.687 12.865,31.003 C12.865,33.214 13.311,35.773 14.105,38.266 C13.946,38.32 13.795,38.401 13.675,38.534 L12.06,40.345 L7.655,35.94 L9.465,34.325 C9.83,34 9.906,33.459 9.645,33.046 C8.617,31.416 7.88,29.636 7.457,27.756 C7.349,27.278 6.884,26.945 6.424,26.977 L4,27.115 L4,20.885 L6.431,21.024 C6.884,21.048 7.354,20.723 7.463,20.246 C7.887,18.373 8.626,16.597 9.656,14.966 C9.917,14.552 9.84,14.011 9.476,13.686 L7.655,12.061 L12.06,7.655 L13.684,9.475 C14.009,9.84 14.552,9.915 14.963,9.655 C16.071,8.958 17.25,8.406 18.478,7.984 C19.428,8.482 20.712,9.213 21.865,10.088 L23.074,8.494 C22.348,7.943 21.581,7.45 20.861,7.023 C20.969,6.852 21.036,6.652 21.023,6.437 L20.884,4 L27.115,4 L26.976,6.439 C26.948,6.927 27.277,7.363 27.754,7.471 C28.562,7.654 29.348,7.906 30.117,8.204 C29.996,8.25 29.872,8.296 29.754,8.341 C29.478,8.447 29.207,8.55 28.946,8.645 L29.626,10.526 C29.898,10.427 30.18,10.32 30.468,10.21 C31.214,9.925 31.979,9.639 32.694,9.465 C32.806,9.531 32.922,9.589 33.033,9.659 C33.444,9.918 33.987,9.844 34.312,9.479 L35.939,7.655 L40.344,12.061 L38.527,13.682 C38.163,14.008 38.087,14.549 38.347,14.962 C39.377,16.593 40.114,18.37 40.538,20.246 C40.645,20.722 41.109,21.048 41.57,21.024 L44,20.885 L44,27.115 Z M45.686,19.099 C45.487,18.91 45.215,18.814 44.943,18.828 L42.283,18.98 C41.866,17.457 41.26,15.998 40.476,14.624 L42.466,12.848 C42.671,12.665 42.793,12.405 42.8,12.131 C42.808,11.856 42.702,11.59 42.507,11.395 L36.605,5.493 C36.411,5.298 36.144,5.194 35.87,5.2 C35.594,5.208 35.336,5.329 35.152,5.534 L33.371,7.53 C31.999,6.747 30.541,6.143 29.02,5.727 L29.171,3.057 C29.187,2.782 29.089,2.513 28.9,2.314 C28.712,2.113 28.449,2 28.173,2 L19.826,2 C19.55,2 19.288,2.113 19.099,2.314 C18.91,2.513 18.812,2.782 18.828,3.057 L18.979,5.724 C17.458,6.14 15.999,6.744 14.626,7.527 L12.847,5.534 C12.664,5.329 12.405,5.208 12.129,5.2 C11.861,5.196 11.588,5.298 11.394,5.493 L5.492,11.395 C5.297,11.59 5.191,11.856 5.199,12.131 C5.207,12.405 5.328,12.665 5.533,12.848 L7.527,14.627 C6.742,16.001 6.136,17.459 5.719,18.98 L3.056,18.828 C2.781,18.813 2.512,18.91 2.313,19.099 C2.113,19.288 2,19.551 2,19.826 L2,28.174 C2,28.449 2.113,28.712 2.313,28.901 C2.512,29.09 2.782,29.19 3.056,29.173 L5.712,29.021 C6.128,30.548 6.733,32.009 7.516,33.384 L5.533,35.153 C5.328,35.336 5.207,35.595 5.199,35.87 C5.191,36.145 5.297,36.411 5.492,36.606 L11.394,42.508 C11.588,42.703 11.859,42.816 12.129,42.8 C12.405,42.793 12.665,42.672 12.847,42.466 L14.617,40.484 C15.994,41.269 17.455,41.876 18.979,42.293 L18.828,44.943 C18.812,45.217 18.91,45.487 19.098,45.687 C19.288,45.887 19.55,46 19.826,46 L28.173,46 C28.449,46 28.712,45.887 28.901,45.687 C29.089,45.487 29.187,45.217 29.171,44.943 L29.02,42.296 C30.547,41.878 32.01,41.272 33.385,40.487 L35.152,42.466 C35.335,42.672 35.594,42.793 35.87,42.8 C36.147,42.819 36.411,42.703 36.605,42.508 L42.507,36.606 C42.702,36.411 42.808,36.145 42.8,35.87 C42.793,35.595 42.671,35.336 42.466,35.153 L40.48,33.381 C41.264,32.005 41.869,30.544 42.285,29.021 L44.943,29.173 C45.214,29.189 45.487,29.09 45.686,28.901 C45.886,28.712 46,28.449 46,28.174 L46,19.826 C46,19.551 45.886,19.288 45.686,19.099 L45.686,19.099 Z"
          id="Fill-1"
          fill="#A166FF"
        />
      </g>
    </svg>
  );
}

function alb() {
  return (
    <svg width="48x" height="48px" viewBox="0 0 48 48">
      <g
        xmlns="http://www.w3.org/2000/svg"
        id="Icon-Resource/Networking-and-Content-Delivery/Res_AWS-Elastic-Load-Balancing_Network-Load-Balancer_48"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <path
          d="M24.0015,44.0029 C12.9725,44.0029 3.9995,35.0299 3.9995,24.0009 C3.9995,12.9729 12.9725,3.9999 24.0015,3.9999 C35.0295,3.9999 44.0025,12.9729 44.0025,24.0009 C44.0025,35.0299 35.0295,44.0029 24.0015,44.0029 L24.0015,44.0029 Z M24.0015,1.9999 C11.8695,1.9999 1.9995,11.8689 1.9995,24.0009 C1.9995,36.1329 11.8695,46.0029 24.0015,46.0029 C36.1335,46.0029 46.0025,36.1329 46.0025,24.0009 C46.0025,11.8689 36.1335,1.9999 24.0015,1.9999 L24.0015,1.9999 Z M29.0835,23.2939 C29.4745,23.6849 29.4745,24.3169 29.0835,24.7079 L26.1405,27.6539 L24.7265,26.2399 L25.9645,25.0009 L18.7505,25.0009 L18.7505,23.0009 L25.9645,23.0009 L24.7265,21.7619 L26.1405,20.3479 L29.0835,23.2939 Z M32.0015,35.2519 L35.2515,35.2519 L35.2515,32.0019 L32.0015,32.0019 L32.0015,35.2519 Z M36.2515,30.0019 L31.0015,30.0019 C30.4485,30.0019 30.0015,30.4489 30.0015,31.0019 L30.0015,36.2519 C30.0015,36.8049 30.4485,37.2519 31.0015,37.2519 L36.2515,37.2519 C36.8045,37.2519 37.2515,36.8049 37.2515,36.2519 L37.2515,31.0019 C37.2515,30.4489 36.8045,30.0019 36.2515,30.0019 L36.2515,30.0019 Z M17.6665,18.7409 L24.9615,14.8909 L23.3945,14.4659 L23.9175,12.5359 L27.9365,13.6249 C28.4695,13.7699 28.7835,14.3179 28.6395,14.8519 L27.5505,18.8729 L25.6205,18.3499 L26.1085,16.5469 L18.6005,20.5109 L17.6665,18.7409 Z M32.0015,16.0009 L35.2515,16.0009 L35.2515,12.7509 L32.0015,12.7509 L32.0015,16.0009 Z M36.2515,10.7509 L31.0015,10.7509 C30.4485,10.7509 30.0015,11.1979 30.0015,11.7509 L30.0015,17.0009 C30.0015,17.5539 30.4485,18.0009 31.0015,18.0009 L36.2515,18.0009 C36.8045,18.0009 37.2515,17.5539 37.2515,17.0009 L37.2515,11.7509 C37.2515,11.1979 36.8045,10.7509 36.2515,10.7509 L36.2515,10.7509 Z M8.3455,27.3469 L15.0355,27.3469 L15.0355,20.6569 L8.3455,20.6569 L8.3455,27.3469 Z M16.0355,18.6559 L7.3455,18.6559 C6.7925,18.6559 6.3455,19.1039 6.3455,19.6559 L6.3455,28.3469 C6.3455,28.8989 6.7925,29.3469 7.3455,29.3469 L16.0355,29.3469 C16.5885,29.3469 17.0355,28.8989 17.0355,28.3469 L17.0355,19.6559 C17.0355,19.1039 16.5885,18.6559 16.0355,18.6559 L16.0355,18.6559 Z M28.6395,33.1499 C28.7835,33.6839 28.4695,34.2319 27.9365,34.3769 L23.9175,35.4669 L23.3945,33.5369 L24.9625,33.1119 L17.6665,29.2619 L18.6005,27.4919 L26.1085,31.4549 L25.6205,29.6519 L27.5505,29.1289 L28.6395,33.1499 Z M32.0015,25.6259 L35.2515,25.6259 L35.2515,22.3759 L32.0015,22.3759 L32.0015,25.6259 Z M36.2515,20.3759 L31.0015,20.3759 C30.4485,20.3759 30.0015,20.8229 30.0015,21.3759 L30.0015,26.6259 C30.0015,27.1789 30.4485,27.6259 31.0015,27.6259 L36.2515,27.6259 C36.8045,27.6259 37.2515,27.1789 37.2515,26.6259 L37.2515,21.3759 C37.2515,20.8229 36.8045,20.3759 36.2515,20.3759 L36.2515,20.3759 Z"
          id="AWS-Elastic-Load-Balancing_Network-Load-Balancer_Resource-Icon_light-bg"
          fill="#A166FF"
        />
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
        <Box
          id="user"
          component="span"
          sx={{ p: 2, border: `0px dashed white` }}
        >
          {User()}
        </Box>
        <br></br>
        <Box
          component="span"
          m={5}
          p={20}
          style={{ position: 'relative', fontSize: 15, padding: 20 }}
          sx={{ p: 2, border: `1px dashed white` }}
        >
          <div
            id="edgelocation"
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
            <div>{cff()}</div>
            <br></br>
            CloudFront <br></br> Function
          </div>
          <br></br>
          <div id="cfd">
            <div>{cfd()}</div>
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
        <h1>
          Hello from <b style={{ color: 'orange' }}>{workstation_id}</b> !
        </h1>
        <h2>
          Your assigned key is{' '}
          <b style={{ color: 'orange' }}>{my_target_group_id}</b>
        </h2>
        <br></br>There are total of{' '}
        <b style={{ color: 'orange' }}>{number_of_target_groups}</b> target
        groups <br></br> Running on{' '}
        <b style={{ color: 'orange' }}>{number_of_vms}</b> Amazon EC2 Instances
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
            xs={mode == 1 ? 6 : 12} // three boxes in mode 1, two box in mode2,3
            sm={mode == 1 ? 4 : 6} // three boxes in mode 1, two box in mode2,3
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
            xs={mode == 1 ? 6 : 12} // three boxes in mode 1, two box in mode2,3
            sm={mode == 1 ? 4 : 6} // three boxes in mode 1, two box in mode2,3
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
      <div id="alb">{alb()}</div>
      Application <br></br>loadbalancer
      <br></br>
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
                  end="edgelocation"
                  lineColor={namesToColors(data[0])}
                  headColor={namesToColors(data[0])}
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
                <Xarrow
                  start="cfd"
                  end="selectedInstance"
                  lineColor={namesToColors(data[0])}
                  headColor={namesToColors(data[0])}
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
