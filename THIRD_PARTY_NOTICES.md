# Third-party notices / 第三方资源说明

[LICENSE](LICENSE) applies to original Paddock Pocket code and documentation contributed by yaodingyaoding-prog. It does not replace the licenses or permissions of dependencies, upstream data, photographs, logos, fonts, models or bundled scripts. Attribution alone does not grant an open license to a photograph or an upstream service.

根目录 MIT 许可证覆盖项目自有代码和文档。第三方内容分别适用原有许可或权利说明；本项目不授予其商标、图片、视频或数据的额外使用权。

| Resource | Use and licensing records |
| --- | --- |
| [F1Push / 发车格](https://f1push.com/) | Reference for information organization and selected interactions; upstream race, standings, driver, telemetry and technical services. Integration code is maintained here; access does not grant a license to the upstream service, data or assets. See [race integration](app/api/data/route.ts), [tools](lib/tool-data.ts), [driver repository](lib/drivers/DriverRepository.ts). |
| [Popukok/smg_live](https://github.com/Popukok/smg_live) | Desktop, Android and paired iPhone/iPad scripts use the maintainer-provided 0.26.0 release and retain `Copyright (c) 2025 _xFox` and MIT notices. See [source and checksum records](public/user-scripts/SOURCE.md), [script license](public/user-scripts/LICENSE) and [Android license](public/user-scripts/ANDROID-LICENSE). The native bundled copy also retains its [license](native/android/assets/web/user-scripts/LICENSE). |
| [Open-Meteo](https://open-meteo.com/) | Weather data attribution, CC BY 4.0 notice and retrieval timestamps are retained in the interface. Provider access and usage terms remain separate from the application code license. |
| Driver and race photographs | Third-party image rights remain with their respective holders. See [current portraits](public/drivers/credits.json), [historical portraits](public/drivers/history/credits.json) and [race imagery notes](docs/profile-features.md). These images are excluded from the project's MIT grant. |
| Team car images in `public/cars/` | Third-party display assets, excluded from the project's MIT grant. The project does not claim their copyright or grant redistribution rights beyond those available from the original rights holders. |
| [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | Circuit data and model basis: [sources and modifications](public/circuits/models/credits.json), [MIT license](public/circuits/models/LICENSE.txt). Other circuit images retain their [source records](public/circuits/credits.json). |
| Barlow Project / Google Fonts | [Font sources](public/fonts/sources.json) and [SIL Open Font License 1.1](public/fonts/OFL-Barlow-Condensed.txt). |
| Vendored stylesheet | [shadcn stylesheet notice](vendor/shadcn-tailwind-4.13.0.LICENSE.md). |
| [soldair/node-qrcode](https://github.com/soldair/node-qrcode) | QR encoder for locally generated sharing posters, MIT. Distributed package notices remain in the dependency. |
| npm dependencies | Packages retain their own licenses distributed with each dependency. The lockfile records the dependency graph; the project MIT license does not override package notices. |
| Video platforms and linked articles | Content remains hosted and controlled by its provider. Replay search links do not redistribute video files or guarantee viewing rights, availability or subscriptions. |

Historical snapshots and data copied from upstream services are not presented as original project data. Formula 1 and team / platform names and marks identify their respective subjects. Paddock Pocket is an independent fan project without official endorsement from Formula 1, F1Push, Five Star Sports or the viewing platforms.
