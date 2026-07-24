# Source Manifest — Blog B31: LIDAR vs RADAR Deep Dive

## Image Assets

| Filename | Type | Description | Source | License | Free? |
|---|---|---|---|---|---|
| `lidar_drone_yellowscan.jpg` | Photo | YellowScan LIDAR drone, 3D mapping | Wikimedia Commons | CC BY-SA 4.0 | Yes |
| `lidar_sensor_p1270901.jpg` | Photo | Solid-state LIDAR sensor on autonomous vehicle | Wikimedia Commons | CC BY-SA 4.0 | Yes |
| `lidar_vs_radar_comparison.svg` | Diagram | LIDAR vs RADAR side-by-side comparison | Created for this blog | Own work | — |
| `sensor_fusion.svg` | Diagram | Three-sensor fusion architecture | Created for this blog | Own work | — |
| `evolution_timeline.svg` | Diagram | LIDAR & RADAR evolution timelines 1930s-2026 | Created for this blog | Own work | — |

## Product Anchors (Technical Claims → Real Products)

### LIDAR

| Claim | Product | Source |
|---|---|---|
| 905nm cheaper, 1550nm safer/longer | Hesai AT128 (905nm) vs Luminar Iris (1550nm) | Hesai product page, Luminar spec sheets |
| Hesai AT1440 unveiled CES 2025, deployed April 2025 | Hesai AT1440 | CES 2025 press release |
| RoboSense supplies Xpeng, NIO | RoboSense Bpearl / M1 | RoboSense press releases, Xpeng specs |
| Luminar Chapter 11 bankruptcy Dec 2025 | Luminar Technologies Inc. | SEC filings, Reuters |
| Austin Russell resigned May 2025 | Luminar CEO | Luminar investor update |
| Volvo ended Luminar partnership Nov 2025 | Volvo Cars | Volvo press release |
| Velodyne + Ouster merger Nov 2022, closed Feb 2023 | Ouster (surviving entity) | Ouster blog, Velodyne Chapter 11 Dec 2022 |
| Aeva FMCW LIDAR measures velocity directly | Aeva X1 | Aeva product page |
| Seyond 1550nm for commercial vehicles | Seyond (formerly Innovusion, rebrand Dec 2023) | Seyond website, NIO test reports |
| LIDAR price < $1000 target | Hesai AT128 street price ~$400-600 (2024-2025) | Industry reports (Yole, Lux Research) |
| LIDAR price floor ~$200 | Chinese OEM volume deals (BYD, Chery) | Automotive News Asia |

### RADAR

| Claim | Product | Source |
|---|---|---|
| ACC pertama 1997 Lexus LS | Toyota/Lexus Pre-Collision System | Lexus press archives, SAE papers |
| 77GHz opened by Korea 2016 | KCC (Korea Communications Commission) | KCC regulation document |
| 77-81 GHz global standard 2022 | ETSI EN 303 628 (Europe), FCC Part 15 (US) | ETSI, FCC documents |
| 4D Imaging RADAR 2024 | Continental ARSR gen3, Bosch 4D Imaging Radar | Continental press, Bosch product page |
| 4D RADAR resolution <0.5° azimuth | Mobileye 4D Radar, Arbe VisionONE | Mobileye technical brief, Arbe spec sheet |
| Continental ARSR gen3 | Continental ARSR-3 | Continental product page |
| Bosch 4D Imaging Radar production | Bosch Radar 4D | Bosch automotive division |
| Mobileye 4D Radar "LIDAR replacement" claim | Mobileye 4D Radar | Mobileye press conference 2023 |
| Arbe integrated with NXP i.MX8 | Arbe VisionONE + NXP S32G | Arbe-NXP partnership announcement |
| Photonic RADAR R&D | Fujikura, CSEM, various academic groups | Fujikura R&D papers, IEEE Photonics |
| Radar price $50-300 | Short-range radar (Bosch SR4) ~$50-80, 4D imaging ~$200-300 | Yole market analysis |

### Sensor Fusion

| Claim | Product | Source |
|---|---|---|
| Kalman Filter + Deep Learning fusion | NVIDIA DRIVE Orin architecture, Waymo Driver | NVIDIA Drive blog, Waymo technical papers |
| World Model output | Mobileye SuperVision, NVIDIA Drive | NVIDIA GTC presentations |
| Tesla camera-only approach | Tesla FSD v12 (pure vision) | Tesla AI Day, Elon Musk statements |
| Tesla removed radar 2021 | Tesla Model 3/Y radar removal | Tesla official blog, Reuters |
| Tesla removed ultrasonic sensors 2022 | Tesla "Batpod" removal | Tesla official blog |

## Research References

- Primary research: `workspace/brand/research/archive/lidar_vs_radar_research.md`
- LIDAR market data: Yole Group, MarketsandMarkets ($1.6B 2023 → $7.7B 2030, CAGR 25%)
- RADAR market data: MarketsandMarkets ($9.2B 2023 → $14.1B 2030, CAGR 6%)
- Internal link: https://t-agung.id/blog/blog23b-vehicle-tech-week-europe-2026-invisible-intelligence/
