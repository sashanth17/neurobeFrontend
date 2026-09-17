import React from "react";
import { FunnelChart } from "react-funnel-pipeline";
import "react-funnel-pipeline/dist/index.css";

export default function Funnel(props: any) {
  const { data, height, width } = props;

  const wrapText = (text: string) => text.replace(/ /g, "\n");

  const formattedData = data.map((item: any) => ({
    name: wrapText(item.name),
    value: item.value,
  }));

  const lastValue = formattedData[formattedData.length - 1]?.value || 1;

  // add empty bottom row
  const finalData = [
    ...formattedData,
    {
      name: "",
      value: lastValue, // keep same width so shape renders
    },
  ];

  return (
    <div style={{ width: width || "auto", height: height || "auto" }}>
      <FunnelChart
        chartWidth={width || "auto"}
        chartHeight={height || "auto"}
        data={finalData}
        showNames
        showValues

        getRowStyle={(row: any) => {
          const index = finalData.indexOf(row);
          switch (index) {
            case 0:
              return {
                backgroundColor: "#dfe9ff",
                border: "1px solid #537bd7",
                height: 70,
              };
            case 1:
              return {
                backgroundColor: "#ffe2c0",
                border: "3px solid #ffa339",
                height: 70,
              };
            case 2:
              return {
                backgroundColor: "#d0ffe0",
                border: "3px solid #128639",
                height: 70,
              };
            case 3:
              return {
                backgroundColor: "#ffc9c9",
                border: "3px solid #dc2626",
                height: 70,
              };
            default:
              return {
                backgroundColor: "#e5e7eb",
                border: "none",
                height: 70,
              };
          }
        }}

        getRowNameStyle={(row: any) => ({
          fontSize: "15px",
          textAlign: "center",
          color: row.name ? "#000000" : "transparent",
          wordWrap: "break-word",
        })}

        getRowValueStyle={(row: any) => ({
          fontSize: "16px",
          fontWeight: 600,
          textAlign: "center",
          color: row.name ? "#000000" : "transparent",
        })}
      />
    </div>
  );
}