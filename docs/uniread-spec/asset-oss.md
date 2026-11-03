# UniRead 规范 · 内容生产阶段的静态资产与 OSS 上传

| 项 | 值 |
| --- | --- |
| 规范编号 | `uniread-spec/asset-oss` |
| 来源 | UniRead 平台接入开发 harveyqing，GitHub [#130](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/130)「[流程需求] 内容生产阶段完成 OSS 上传：RC 预生成 releaseId，沿用 BE key」，附件 `rc-agent-oss-production-guide-2026-10-27.zip` 中的 `15-agent-asset-oss-guide.md` |
| 维护方 | UniRead 平台接入开发（本文件以平台下发原文为准，本项目不改写其要求） |
| 版本 | 0.2（2026-10-27） |
| 适用范围 | 采用「生产阶段上传资产」的交付：合集封面／缩略图、听力与口语预生成音频；共享字体另按字体包流程 |

本项目的落实办法（工具、文件位置、状态）写在 [docs/14 §14](../14-agent-production-rules.md#14-静态资产与-oss-上传uniread-specasset-oss130版本02)，不写进本文件。原文中的相对链接（`../scripts/…`、`14-agent-production-rules.md`）以 `docs/` 为基准。**测试、生产 OSS 的实际配置与凭证由维护方私下交接，不得写入本仓库。**

## 原文

# 内容生产 Agent：静态资产生产、版本与 OSS 交付指引

版本：0.2，2026-10-27。对象：内容生产 Agent、生产同事、BE 接入开发者。本版按用户要求更正：OSS key 必须与当前 BE 完全一致，不新增素材命名空间。

状态：现有 BE key 规则已核对；生产端上传计划工具与 BE 预上传复用流程待接入。

目标：图片、音频等静态素材在内容生产阶段完成整理、版本冻结、OSS 上传及远端验真；BE 转换时校验并复用，不再承担这些素材的首次上传。BE 继续负责平台运行包构建、私有答案绑定、鉴权、登记和发布。

**执行状态：本次只前移上传职责，不改变现有 BE 的 key 推导和登记包字段。** 当前 RC 有本地资源校验、媒体清单和压缩包交付，尚无本文描述的通用资产上传入口。下文上传计划是拟新增的辅助交接文件，不是 BE 已接受的新登记协议。工具未就绪时可完成素材准备，须报告接入缺口，不能编造命令、向现有登记包硬加字段或宣称上传完成。

本指引针对明确采用“生产阶段上传资产”的任务，调整旧生产规约第 5 节“接入方负责上传”的职责分工；其他内容、身份、布局、答案隔离要求继续有效。它不授予生产环境写入、平台发布、Explore 分发、收藏绑定、删除对象或修改 bucket 策略的权限；实际操作范围以本次用户任务为准。已有明确授权无需逐步重复确认。

## 1. 开始前取得的任务输入

| 输入 | 要求 |
| --- | --- |
| 内容范围 | 实际来源项目、Playlist／Item 范围；不得把全仓素材当成本次范围 |
| 内容版本 | `sourceId`、`contentReleaseId`、源码固定 commit；有未提交内容或 Git 忽略媒体时，另记录实际文件摘要 |
| 平台身份 | 冻结的 selection、按 BE 既有算法计算的资源 fingerprint、RC 预先生成并固定的 `releaseId`；音频上传前必须齐备，无需等待 BE 构建 |
| 存储目标 | 本次允许的 `storageTargetId`、profile 文件及测试／生产操作范围 |
| 工具 | 维护方提供的资产扫描／上传／验证入口及其协议版本 |
| 凭证来源 | 执行环境注入或指定的受控凭证位置；不要求用户在对话中粘贴密钥 |
| 接入能力 | BE 是否支持现有登记包、媒体格式、存储目标及预上传素材复用 |

缺少生产 profile 时只准备材料或使用已获授权的测试目标。不得根据文件名、当前终端环境或上一次上传成功推断本次允许写生产。

首阶段仅前移静态素材上传：**保留源 JSON 相对路径；普通题图继续允许内嵌 HTML；音频继续沿用平台鉴权。** 不因本任务修改标题、拆题、题目和稳定业务 ID。当前三年级已确认的一篇文章保留全部题目等内容决策，不由资产工具重新决定。

## 2. 哪些文件需要上传

按本次内容实际引用建立完整依赖集合，再与 BE 的上传声明核对。**上传按目标 bucket＋完整 objectKey 去重，不是仅按文件 SHA 去重。** 同一音频在不同 release／资源下会产生不同 key，必须遵守当前 BE 规则分别准备对象。

| 类别 | 收集范围／处理方式 |
| --- | --- |
| 合集封面 | 使用 BE handoff 图片声明及 `imageObjectKey` 对应 key 上传 |
| 文章、题目和选项图片 | 收集实际引用文件并保留本地；当前 BE 将普通题图内嵌 HTML，没有独立上传声明／key，默认不额外上传。若同图也作为封面或 thumbnail 声明，只按该声明上传 |
| 缩略图 | 实际使用的独立 thumbnail 按 BE handoff 图片声明上传；复用封面或平台占位时明确记录，不伪造图片 |
| 听力音频 | Section 实际引用的完整录音；保留原书播放次数、时长及来源说明 |
| 口语提示音频 | Speaking turn 引用的考官／伙伴预生成音频；TTS 与原书录音分开标记 |
| 其他媒体 | 检查 Item 的 media 及全部已定义资源字段；只有现有 BE 登记包声明且支持的对象才上传，其余列能力缺口，不自造 key |
| 字体 | 作为独立共享字体包处理，固定包版本、文件摘要和许可证；包括当前页面实际依赖的 Noto Emoji，不按每本书重复上传 |
| 视频 | 收集实际交付文件并列缺口；当前 BE 无通用视频接入规则，不擅自分配 key 或作为已支持对象上传 |

下列内容不进入普通静态素材上传清单：

- Key、答案册、标准答案、未开放解析、私有听力转写、含答案的复盘截图。
- 原始整本 PDF、OCR 中间文件、裁图工作底稿、未引用的实验文件；确需留作证据时走独立受控交付。
- 学生录音、学生答案、学习记录；它们属于线上学习数据。
- BE 转换后产生的 HTML、平台来源报告、登记包和评分材料；由接入端按原流程生成和处理。

首批支持格式以实际上传工具和 BE 的共同白名单为准。当前 BE 封面／缩略图上传仅支持 PNG/JPEG；HTML 内嵌图片可支持的格式更多，不能据此推断都可作为独立 OSS 图片接入。现有音频校验包含 MP3、M4A/MP4 音频容器、OGG、WEBM 音频；扩展格式须同步类型、容器校验和播放验证，不改后缀冒充兼容格式。

## 3. 保留来源路径，单独记录存储映射

RC Item／Playlist 继续使用原来的相对路径，例如：

```text
assets/ci-g3/cover.jpg
assets/ket1/ket1-t1-p1.m4a
```

路径相对于 `content/`。保留实际本地文件，以支持现有 RC 校验、离线预览和构建；不要因上传成功立即删除本地文件或取消现有媒体包交付。

不要把 `src`、`cover`、`thumbnail` 改成 OSS 域名、`oss://`、本机绝对路径、临时签名 URL 或含凭证的链接。当前 RC 路径解析和 BE 构建并不支持直接这样替换。由离线上传计划记录“来源路径 → BE 固定对象”的映射；普通内嵌题图只记录本地依赖，不虚构独立对象。环境和临时下载凭据继续由现有适配层解析。

资产枚举必须理解实际 Schema。`imageRef.image` 等逻辑图片 ID 先解析到图片注册表，不能把 ID 当作路径；同一文件的全部使用位置都要保留。不能只扫描 `article.images`，也不能把任意字符串都当资源 URL。

## 4. 版本与 OSS key 规则

### 4.1 分开三种版本

| 身份 | 含义 |
| --- | --- |
| 文件 SHA256 | 最终上传字节的完整 SHA-256，是不可变文件版本；不是文件名、Git commit 或 OSS ETag |
| `contentReleaseId` | 一批冻结内容及资产引用集合的交付标识，首次冻结后不可改写 |
| `releaseId` | RC 在一次新交付冻结时生成的非零规范 UUID，推荐 UUIDv4；它也是后续 BE 登记／发布身份和音频 key 的组成部分，BE 构建时接收并沿用，不重新分配 |

素材先完成裁图、压缩、音频转码等处理，再计算摘要。修改一个像素、重新转码或重生成 TTS 都必须重新计算；不得沿用旧 SHA 和 key。Git 忽略的媒体也必须纳入摘要，不能只交源码 commit。

### 4.2 完全沿用现有 BE key

下列规则以 BE 当前生成函数为准。objectKey 不含 bucket、域名或前导斜杠：

| 对象 | 现有 key | 生成依据 |
| --- | --- | --- |
| 封面／thumbnail 的 JPEG | `exam-media/v1/<sha256>.jpg` | `imageObjectKey`，`ContentType=image/jpeg` |
| 封面／thumbnail 的 PNG | `exam-media/v1/<sha256>.png` | `imageObjectKey`，`ContentType=image/png` |
| 音频 | `exam-resources/v1/<releaseId>/<resourceFingerprint>/media/<sha256><ext>` | `Package.MediaObjectKey`；`ext` 严格取来源 `SourcePath` 的末尾扩展名并转小写，保留前导点，不把 `.m4a` 改成 `.mp4` |
| 共享字体 | `exam-fonts/v1/<packId>/files/<fontSHA256>.woff2` | 现有字体包工具；同包另有 `font-pack.json`、`licenses/` |
| HTML（仍由 BE 处理） | `exam-resources/v1/<releaseId>/<resourceFingerprint>/<htmlSHA256>.html` | `Package.ObjectKey` |
| 来源报告（仍由 BE 处理） | `exam-metadata/v1/<releaseId>/<sourceMetadataSHA256>.json` | `Package.MetadataUploads` |
| 普通内嵌题图 | 无独立 key | 当前作为 HTML 的一部分，不套用封面 key 冒充现有上传对象 |

`resourceFingerprint` 是按 BE 既定算法确定的资源 UUID，RC 可离线计算，无需访问 BE 服务或数据库；它不是原始 `itemId`、`resourceId`、图片 ID 或 `materialId`。音频文件 SHA 相同但 release／资源 fingerprint 不同时，key 仍不同。图片相同 SHA 和 MIME 可复用相同 key；字体按现有 packId 复用。

不新增素材命名空间，不向 key 拼接 `contentReleaseId`、测试／生产标签、学校、用户名或日期，也不使用可变 `latest`。辅助上传计划和回执作为交接文件保存，不为其新造 OSS 路径；不能将它们上传到 `exam-metadata` 冒充 BE 来源报告。

### 4.3 RC 自行生成身份，BE 事后沿用并验算

**不要求 BE 提前生产或分配身份。** 当前 BE 只要求 `releaseId` 是非零、规范格式的 UUID，并与资源定义一致，不要求它由服务端签发。RC 可使用标准库生成 UUIDv4，并随冻结交付保存；后续重试、测试提升到生产和 BE 导入读取该值，不在每次执行时重新生成。

资源 fingerprint 则必须确定性计算，不能随机生成。当前算法为：

```text
namespace = UUIDv5(UUID_NAMESPACE_URL, "uniread/exam-import/rc-selection-1")
resourceFingerprint = UUIDv5(namespace,
    compactJSON(["resource", sourceId, paperId, resourceId]))
playlistFingerprint = UUIDv5(namespace,
    compactJSON(["playlist", sourceId, paperId]))
```

`compactJSON` 必须与当前 BE 的 Go JSON 编码一致。以上身份字段沿用已校验的安全 slug，数组顺序固定、无额外空格／换行；不能把四段直接用斜杠连接。namespace 名称中的 `rc-selection-1` 即使在 selection-2 中也保持不变，不自行升版。算法应固定在 RC 可离线运行、经跨仓样例核对的工具里，不能由每批 Agent 自由重写。

生产阶段：

1. 冻结 `sourceId`、`paperId`、`resourceId`、Section 映射和最终素材字节，不因上传改变拆题。
2. RC 生成一次 `releaseId`，按上述算法计算各资源 fingerprint，再按第 4.2 节精确生成图片和音频 key。
3. 生成并冻结上传计划，绑定内容快照、selection 文件摘要、release、资源身份和素材摘要；此时无需 candidate、buildId、HTML、登记包或 `registrationSHA256`。
4. 按已授权环境上传并验真，交付来源、selection、计划和回执；不要把这些辅助字段塞进 strict Item／Key／selection 对象。

BE 事后转换：

1. 使用交付的精确 selection，独立重算资源 fingerprint，逐项核对计划中的身份、文件摘要及现有 key；不接受生产端自报 UUID 作为唯一依据。
2. `prepare_registration.py --release-id <RC生成并固定的releaseId>` 已支持传入该值。构建、私有答案和最终发布沿用同一 release，不能省略参数而分配另一值。
3. 最终登记包生成后，再记录 `registrationSHA256` 与计划摘要的接入验真结果；它是事后补充证据，不是生产上传的前置条件。

RC 通用身份／计划生成工具及 BE 自动读取、比对交付身份的编排入口尚待接入，UUID 格式和既有 key 无需改变。来源或映射变化时重新冻结交付；已绑定登记包的 release 不得重用于不同字节。资源 fingerprint 对同一稳定选材身份保持不变，不能随 release 随机重建。跨资源／跨 release 的音频去重会改变现有约定，不在本次范围。

## 5. 上传计划：拟新增辅助交接格式 `be-asset-upload-plan-1`

上传计划由 RC 根据冻结的 selection、素材及当前 BE 算法离线生成，不依赖提前生成登记包，不作为新的登记协议，也不加入 Item／Key／registration 的 strict JSON。它不含环境域名、bucket、凭证、临时签名和私有答案，不决定如何拆题。

示例仅说明字段；所有尖括号占位值必须由工具读取真实文件后生成，不能将本例当作可导入材料：

```json
{
  "format": "be-asset-upload-plan-1",
  "sourceId": "uniread-rc",
  "contentReleaseId": "ci-g3-20261027-01",
  "sourceCommit": "<真实固定commit>",
  "contentSnapshotSHA256": "<本次公开内容文件清单的完整摘要>",
  "releaseId": "<RC生成并固定、由BE后续沿用的UUIDv4>",
  "selectionSHA256": "<冻结选材文件的完整SHA256>",
  "keyPolicyVersion": "be-exam-existing-v1",
  "files": [
    {
      "sourcePath": "assets/ci-g3/cover.jpg",
      "roles": ["playlist-cover"],
      "sha256": "<最终文件字节的完整SHA256>",
      "sizeBytes": 123456,
      "contentType": "image/jpeg",
      "objectKey": "exam-media/v1/<相同SHA256>.jpg",
      "usedBy": [
        {
          "playlistId": "ci-g3",
          "document": "playlists/ci-g3/playlist.json",
          "pointer": "/cover"
        }
      ]
    }
  ]
}
```

字段与绑定要求：

- 以完整 objectKey 去重，每项保留对应来源路径、角色和全部使用位置。一个来源音频可能对应多个资源 key，须分别列项；多个来源路径指向同一对象时，工具须在该项使用位置中完整记录路径映射。
- `document` 相对于 `content/`；`pointer` 使用 JSON Pointer，须能解析到实际来源字段。可附带 Item／Section／Question／Turn ID 方便核对，不以数组下标替代业务身份。
- `contentSnapshotSHA256` 绑定排序固定的公开内容文件摘要清单；相关文件清单随交付保留。该摘要不含测试／生产配置和上传回执，也不代替私有 Key 的独立摘要。
- 音频项另含登记中的 `resourceFingerprint`、`assetId`、`SourcePath` 对应的 `sourcePath`、实际 `seconds`、`originType`（原书录音／TTS／其他明确来源）及生成／转码说明；不能将测试合成音频标成正式录音。
- 字体沿用独立 font-pack manifest，主交接记录所依赖 packId 和摘要，不混用两种 manifest 的文件字段。
- 清单冻结后对精确 UTF-8 文件字节计算 `manifestSHA256` 并写入回执。清单不包含自己的 SHA，也不分配新的 OSS manifest key；重新排版视为清单字节变化。
- 同一 `contentReleaseId` 不得悄悄改写内容快照，计划以 `contentReleaseId`＋`releaseId`＋`selectionSHA256` 及自身摘要绑定。`registrationSHA256` 由 BE 构建后另记，不能要求 RC 上传前提供。同一 BE `releaseId` 不得对应改写后的登记材料，同一精确材料可幂等复用。

RC 现有 `MEDIA.json` 的 `path`、`bytes`、`sha256`、`seconds`、`usedBy` 可作为生成输入，按工具确定的映射转换，不手抄或分别维护冲突清单。所有实际引用必须覆盖，缺少文件、未支持格式或未知引用类型均报告为未完成。

## 6. 测试与生产使用独立 storage profile

**测试、生产 OSS 的实际配置及凭证由维护方私下交接。** endpoint、region、bucket、CDN 映射、权限范围及凭证获取方式均不在公开 issue、评论、附件或仓库内填写真实值；公开方案只保留配置字段和占位示例。收到配置后存放于受控环境，不把完整配置再贴回 issue。

优先使用不同 bucket 隔离测试和生产，使用 BE 各环境配置对应的实际 bucket。**只更换存储配置，不给 key 增加环境前缀。** 同一份冻结交付使用相同 release／资源身份时，相同 key 可以存在于不同 bucket；若两边明确使用不同 releaseId，则 RC 先生成各自计划、BE 后续分别沿用，不能直接复用测试计划的音频 key。

以下是拟采用的配置结构示例，不是现有命令已支持的配置文件；真实值由存储维护方提供：

```yaml
profiles:
  test:
    storageTargetId: exam-materials-test
    endpoint: https://<测试OSS-endpoint>
    region: <测试region>
    bucket: <测试bucket>
    allowedPrefixes:
      - exam-media/v1/
      - exam-resources/v1/<本次releaseId>/
    keyPolicyVersion: be-exam-existing-v1
    credentialRef: env:RC_ASSET_TEST_STS
  production:
    storageTargetId: exam-materials-production
    endpoint: https://<生产OSS-endpoint>
    region: <生产region>
    bucket: <生产bucket>
    allowedPrefixes:
      - exam-media/v1/
      - exam-resources/v1/<本次releaseId>/
    keyPolicyVersion: be-exam-existing-v1
    credentialRef: env:RC_ASSET_PRODUCTION_STS
```

`credentialRef` 是凭证提供器的逻辑名称，不是将 AK／SK／Token 拼接成字符串；实际注入映射由上传工具明确提供。profile 可另带经核验的 `deliveryBaseURL`，但上传 endpoint、bucket 与 CDN 映射必须分别验证。

`allowedPrefixes` 只是预检边界，不表示允许任意对象写入；实际写入范围须收紧到本次计划的精确对象。字体上传按既有流程另授权 `exam-fonts/v1/<packId>/`，不让普通素材任务任意写字体目录。

- 使用限定 bucket／前缀和有效期的 STS，或平台发放的固定对象上传凭据；不向生产 Agent 暴露长期主账号密钥。
- 凭证从执行环境或明确指定的受控文件注入，不写入内容、manifest、截图、日志或交接文档。不要读取整份 BE 配置来获取无关数据库等凭证。
- 兼容现有配置时可复用 `ALI_OSS_RS_ENDPOINT`、`ALI_OSS_RS_ACCESS_KEY`、`ALI_OSS_RS_SECRET_KEY`、`ALI_OSS_RS_BUCKET` 等名称，但 STS token 支持、profile 优先级和目标校验须由工具实现；不能认为现有客户端已经支持 STS。
- 上传预检须核对实际解析出的存储目标与选定 profile 完全一致；禁止环境变量悄悄把测试切成生产。dry-run 不读取凭证、不联网。
- 若测试／生产现有 BE 配置共用 bucket，须如实报告共享对象的事实，不自行添加环境前缀。需要隔离时由维护方配置独立 bucket；在现有 key 约束下不能声称仅靠 profile 名称实现对象隔离。
- 测试回执不能用于生产登记。提升到生产时使用同一份冻结素材，上传或由受控工具复制相同字节后，在生产目标重新验真并生成独立回执。

## 7. 生产 Agent 的执行顺序

下列是工具应支持的操作阶段，不是已存在的 CLI 命令。只调用维护方提供的真实入口；尚无入口时交付清单和缺口，不临时编写绕过协议的生产 uploader。

1. **核对范围与能力。** 记录源版本、允许的 profile、工具版本和 BE 协议支持；检查目标存储的上传与读取策略。
2. **生产最终素材。** 完成裁图、转码、必要的预生成音频。保留来源和用途，不因本任务擅自付费生成或改变素材内容。
3. **收集实际引用。** 枚举并解析本次内容依赖，核对文件、容器、MIME、大小、图片尺寸／音频时长；相对路径不得越界，不允许符号链接或任意外部 URL。
4. **生成身份与计划。** 按第 4.3 节由 RC 固定 selection、生成 releaseId、按 BE 既有算法计算资源 fingerprint，再生成素材上传计划。检查摘要和精确对象范围，不等待 BE 构建或登记包。
5. **离线预检。** 输出本次精确对象范围、数量、字节总量和拟选目标；无上传授权时停留于准备状态。
6. **上传并鉴权回读。** 明确选定已获授权的 profile 后执行不可覆盖上传。已存在对象须核验内容和元数据，相同则复用；不符时失败，不能覆盖修复。ETag、HTTP 200、HEAD 长度或用户自报 metadata 都不能替代实际字节 SHA 验证。
7. **固定计划与回执。** 全部对象核验后保存本地计划、精确摘要与指定环境的回执。它们是辅助交接文件，不写入新的 OSS 清单路径，不代替原 registration／来源报告。
8. **验证实际交付路径。** 通过既定平台读取方式核对媒体可加载。私有媒体保留鉴权和短期下载凭据；只有本来允许公开读取的字体等才做匿名读取、CORS 和缓存验真。不得自行开放 bucket。
9. **交付。** 输出固定 manifest、指定环境的上传回执、内容／源码／私有答案的对应版本、实际验证结果及未完成项；BE 未接入时如实注明。

失败处理：任一对象上传或校验失败，停止发布就绪判定并记录失败类别、对象 key 和已确认阶段，不记录签名 URL／SDK 敏感错误。允许同一材料显式重试或续传；重试先核对已存在对象，禁止自动删除、覆盖、修改 ACL 或重新生成媒体“凑成功”。

## 8. 上传回执与状态

每个存储目标单独生成回执，至少包括：

```text
receiptFormat / uploaderVersion
sourceId / contentReleaseId / releaseId / selectionSHA256 / manifestSHA256
storageTargetId / endpoint / region / bucket / keyPolicyVersion
planFile / planVerifiedAt
verifiedObjects[]: objectKey / sha256 / sizeBytes / contentType / verifiedAt
reusedObjectCount / newlyUploadedObjectCount
deliveryVerification: not-run | passed | failed
status / failedObjects / lastConfirmedPhase
```

回执不可包含 AK、SK、STS Token、签名 URL 或答案正文。它是操作证据，不是信任根：BE 仍按自己的目标配置、允许前缀、固定 manifest 和远端对象独立验真。

生产回执不要求 `registrationSHA256`；BE 事后生成登记包后，在独立接入记录中补充该摘要及计划摘要，不修改已冻结的生产计划来形成循环依赖。

| 状态 | 可以表示什么 |
| --- | --- |
| `PREPARED` | 本地文件和清单检查通过，未证明远端存在 |
| `UPLOADED_VERIFIED` | 指定存储目标全部计划内对象完成鉴权回读验真，本地计划摘要核对通过 |
| `DELIVERY_VERIFIED` | 另外通过了规定的实际读取路径验证；须注明路径及覆盖范围 |
| `INCOMPLETE` | 有缺失／失败／未确定结果，交付未完成 |

这些状态均不表示内容已人工审核、BE 已登记／发布、学生已收藏或已加入 Explore。不要把上传工具的成功状态改写为 `PUBLISHED`。

## 9. BE 接入边界与兼容要求

维护方需要先实现并验证以下能力，生产 Agent 不通过修改平台数据来替代：

现有 `ImportExamScript` 已会对相同 key 执行不可覆盖 PUT，再通过 GET 和摘要确认已有对象，可复用预先存在的精确字节；但它仍会尝试 PUT，不是纯验证模式。严格要求 BE 对素材不再发起 PUT 时，需要增加对应执行模式，不能把“不会覆盖”描述为“没有尝试上传”。

- 继续使用现有 registration 与 `Package.Uploads()` 的对象声明和 key；辅助上传计划只用于编排及验真，不被解释为新登记协议或可自由指定 key 的输入。
- BE 导入使用同一固定登记包，按自己的环境配置和现有 key 函数读取预上传素材，核对完整字节、MIME、大小及来源绑定；预上传模式不对该素材执行 PUT，缺失时明确失败，不静默补传。
- 普通题图首阶段继续从经过来源摘要校验的本地文件构建内嵌，保持原页布局、响应式和交互，不额外分配 OSS key；移除内嵌、直接从 OSS 加载属于另外的改造范围。
- 音频继续通过现有 `MediaObjectKey()` 定位对象，保留资源、Attempt、release 的鉴权以及短时下载凭据和字节完整性校验。上传提前不等于音频变为公开访问。
- HTML、评分材料、来源报告和平台登记仍按各自协议处理，不混入内容素材命名空间。
- 凡通过 CDN 或浏览器直读的路径，独立验证实际域名、MIME、跨域、签名有效期及缓存；需要 Range 的播放方式另验 Range，不以 OSS 上传成功代替客户端验收。
- 本任务不清理历史发布、旧资源、学生记录、收藏或表结构，不改变已确认的标题和内容组织方式。

不得接受任意 bucket、对象 key 或 URL 并直接抓取；目标由 BE 配置约束，key 由既定规则推导。`SHA256` 用于版本和完整性，不是访问授权。

## 10. 交接填写与验收

在本次独立交接文档中填写以下内容，不覆盖空白模板：

```text
本次内容范围：
sourceId / contentReleaseId / sourceCommit / 实际内容快照摘要：
RC固定releaseId / selectionSHA256 / 资源fingerprint算法与核对依据：
BE事后补充的registrationSHA256与计划验真结果（未构建填未生成）：
资产协议 / key 规则 / 上传工具版本：
本地素材位置 / manifest 位置及完整摘要：
共享字体包版本、许可证及托管方式：
实际存储 profile / storageTargetId / bucket：
上传范围：引用数、来源文件数、去重对象数、字节总量：
新增上传数 / 已存在并验真复用数 / 失败数：
回执位置及状态：
实际读取验证的环境、路径、覆盖项及结果：
内容、私有Key与素材版本是否对应：
BE 协议支持、登记／发布状态及剩余缺口：
```

首次端到端试点选一个包含封面、题图、听力录音和口语提示音频的明确内容集合。验收应证明：

- 全部引用可定位，引用没有遗漏，上传对象没有混入答案或无关文件。
- 重复上传相同材料复用对象；文件变化产生新 key，旧版本仍可读取。
- 对同一登记包，导出的全部素材 key 必须逐项等于当前 BE 函数生成值，不能只检查前缀相同。音频扩展名、releaseId、资源 fingerprint 也须完全一致。
- 测试／生产可以使用不同 bucket，按各自固定登记包的 key 和字节集合独立验真；测试回执不能冒用为生产回执。不同 release 的音频 key 不能按文件 SHA 合并。
- 缺失、目标错误、摘要不符、格式不支持、凭证过期时，流程明确失败，不覆盖对象、不修改权限、不自动发布。
- BE 导入复用预上传素材，仍验证完整性；新旧发布的媒体引用和访问鉴权均正常。
- 实际浏览器可显示图片、播放音频，字体及页面布局／交互保持来源行为；未测的场景明确列出。

## 11. 当前实现定位

核对基线：RC `c82648c`；BE `origin/main` `bcf09c8`。代码状态不代替环境验收。以下仅用于维护方定位，生产 Agent 不必修改 BE：

| 仓库 | 现有入口 |
| --- | --- |
| RC | [`scripts/validate.ts`](../scripts/validate.ts)：本地引用校验；[`scripts/make-handoff-release.mjs`](../scripts/make-handoff-release.mjs)：媒体包与 `MEDIA.json` |
| RC | [`src/lib/content.ts`](../src/lib/content.ts)：相对路径资源解析；[`docs/14-agent-production-rules.md`](14-agent-production-rules.md)：原生产规约 |
| BE | `scripts/exam_resources/import_rc.py`、`build_runtime.py`：来源资产收集、题图内嵌和音频投影 |
| BE | `pkg/examregistration/metadata.go`、`media.go`、`package.go`：现有对象 key 与上传声明 |
| BE | `pkg/service/v2/exam_script_intake.go`：不可覆盖上传、回读验真与发布；`exam_media_service.go`：媒体鉴权和下载 |
| BE | `scripts/exam_resources/font_pack.py`、`publish_font_pack.py`：可参考的独立字体包上传和验真能力 |

本文没有新增实际命令、修改来源 Schema／BE 登记协议或完成环境上传。需要实现的是：复用现有 BE key 的计划导出、生产端上传和 BE 预上传素材验真模式；不是增加新的对象路径。工具接入后按实际验收结果更新本节状态。

---

## 更新记录

| 版本 | 日期 | 来源 | 变化 |
| --- | --- | --- | --- |
| 0.2 | 2026-10-27 | #130 | 首次下发；原文 SHA-256 `c4599e6d5f7d03a2997b2a0e407de195d8fbc1149ee27f72cd2673b2f178aca3`（与附件 `SHA256SUMS` 一致） |
