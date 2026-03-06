"""
Export Service
Handles CSV and PDF export of budget data, anomalies, and predictions
"""
import io
import csv
from datetime import datetime
from typing import List, Dict, Optional
import logging
import pandas as pd
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting budget data in various formats"""
    
    @staticmethod
    def export_anomalies_csv(anomalies: List[Dict], filename_prefix: str = "anomalies") -> bytes:
        """
        Export anomalies to CSV format
        
        Args:
            anomalies: List of anomaly dictionaries
            filename_prefix: Prefix for filename
            
        Returns:
            CSV file content as bytes
        """
        try:
            # Convert to DataFrame for easy CSV export
            df = pd.DataFrame(anomalies)
            
            # Select relevant columns
            cols_to_export = [
                'department_id', 'severity', 'detecting_method', 
                'rule_violations', 'ml_score', 'created_at'
            ]
            
            available_cols = [col for col in cols_to_export if col in df.columns]
            df = df[available_cols] if available_cols else df
            
            # Convert to CSV
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            logger.info(f"✅ Exported {len(anomalies)} anomalies to CSV", extra={
                "format": "csv",
                "record_count": len(anomalies),
                "filename_prefix": filename_prefix
            })
            
            return output.getvalue().encode('utf-8')
            
        except Exception as e:
            logger.error(f"❌ Error exporting anomalies to CSV: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def export_predictions_csv(predictions: List[Dict], filename_prefix: str = "predictions") -> bytes:
        """
        Export lapse predictions to CSV format
        
        Args:
            predictions: List of prediction dictionaries
            filename_prefix: Prefix for filename
            
        Returns:
            CSV file content as bytes
        """
        try:
            df = pd.DataFrame(predictions)
            
            # Select relevant columns
            cols_to_export = [
                'dept_id', 'risk_level', 'risk_score', 'days_until_lapse',
                'r2_score', 'predicted_lapse_date', 'spending_index'
            ]
            
            available_cols = [col for col in cols_to_export if col in df.columns]
            df = df[available_cols] if available_cols else df
            
            # Convert to CSV
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            logger.info(f"✅ Exported {len(predictions)} predictions to CSV", extra={
                "format": "csv",
                "record_count": len(predictions),
                "filename_prefix": filename_prefix
            })
            
            return output.getvalue().encode('utf-8')
            
        except Exception as e:
            logger.error(f"❌ Error exporting predictions to CSV: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def export_budget_csv(budgets: List[Dict], filename_prefix: str = "budgets") -> bytes:
        """
        Export budget data to CSV format
        
        Args:
            budgets: List of budget dictionaries
            filename_prefix: Prefix for filename
            
        Returns:
            CSV file content as bytes
        """
        try:
            df = pd.DataFrame(budgets)
            
            # Select relevant columns
            cols_to_export = [
                'dept_id', 'dept_name', 'allocated', 'spent', 'remaining',
                'utilization_pct', 'last_transaction_date'
            ]
            
            available_cols = [col for col in cols_to_export if col in df.columns]
            df = df[available_cols] if available_cols else df
            
            # Convert to CSV
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            logger.info(f"✅ Exported {len(budgets)} budget records to CSV", extra={
                "format": "csv",
                "record_count": len(budgets),
                "filename_prefix": filename_prefix
            })
            
            return output.getvalue().encode('utf-8')
            
        except Exception as e:
            logger.error(f"❌ Error exporting budgets to CSV: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def export_anomalies_pdf(anomalies: List[Dict], title: str = "Anomaly Detection Report") -> bytes:
        """
        Export anomalies to PDF format
        
        Args:
            anomalies: List of anomaly dictionaries
            title: Report title
            
        Returns:
            PDF file content as bytes
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF export. Install with: pip install reportlab")
        
        try:
            # Create PDF
            pdf_buffer = io.BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=landscape(A4))
            story = []
            
            # Add title
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1f2937'),
                spaceAfter=30,
            )
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 0.3*inch))
            
            # Add metadata
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            meta_text = f"Generated on {timestamp} | Total Records: {len(anomalies)}"
            story.append(Paragraph(meta_text, styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
            
            # Create table data
            if anomalies:
                # Get all unique keys to use as columns
                all_keys = set()
                for anomaly in anomalies:
                    if isinstance(anomaly, dict):
                        all_keys.update(anomaly.keys())
                
                columns = sorted(list(all_keys))[:8]  # Limit to 8 columns for readability
                
                # Add header row
                table_data = [columns]
                
                # Add data rows
                for anomaly in anomalies[:50]:  # Limit to 50 rows per PDF
                    row = []
                    for col in columns:
                        value = anomaly.get(col, '')
                        if isinstance(value, (dict, list)):
                            value = str(value)[:50]  # Truncate long values
                        row.append(str(value)[:30])
                    table_data.append(row)
                
                # Create table
                table = Table(table_data, colWidths=[1.0*inch] * len(columns))
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(table)
            else:
                story.append(Paragraph("No anomalies found", styles['Normal']))
            
            # Build PDF
            doc.build(story)
            pdf_content = pdf_buffer.getvalue()
            pdf_buffer.close()
            
            logger.info(f"✅ Exported {len(anomalies)} anomalies to PDF", extra={
                "format": "pdf",
                "record_count": len(anomalies),
                "title": title
            })
            
            return pdf_content
            
        except Exception as e:
            logger.error(f"❌ Error exporting anomalies to PDF: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def export_predictions_pdf(predictions: List[Dict], title: str = "Lapse Prediction Report") -> bytes:
        """
        Export predictions to PDF format
        
        Args:
            predictions: List of prediction dictionaries
            title: Report title
            
        Returns:
            PDF file content as bytes
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF export. Install with: pip install reportlab")
        
        try:
            # Create PDF
            pdf_buffer = io.BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=landscape(A4))
            story = []
            
            # Add title
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1f2937'),
                spaceAfter=30,
            )
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 0.3*inch))
            
            # Add metadata
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            meta_text = f"Generated on {timestamp} | Total Records: {len(predictions)}"
            story.append(Paragraph(meta_text, styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
            
            # Create table data
            if predictions:
                columns = ['Department ID', 'Risk Level', 'Risk Score', 'Days Until Lapse', 'R² Score']
                table_data = [columns]
                
                for pred in predictions[:50]:
                    row = [
                        str(pred.get('dept_id', '')),
                        str(pred.get('risk_level', '')),
                        str(pred.get('risk_score', '')),
                        str(pred.get('days_until_lapse', '')),
                        str(pred.get('r2_score', ''))[:10],
                    ]
                    table_data.append(row)
                
                # Create table
                table = Table(table_data, colWidths=[1.2*inch] * len(columns))
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(table)
            else:
                story.append(Paragraph("No predictions found", styles['Normal']))
            
            # Build PDF
            doc.build(story)
            pdf_content = pdf_buffer.getvalue()
            pdf_buffer.close()
            
            logger.info(f"✅ Exported {len(predictions)} predictions to PDF", extra={
                "format": "pdf",
                "record_count": len(predictions),
                "title": title
            })
            
            return pdf_content
            
        except Exception as e:
            logger.error(f"❌ Error exporting predictions to PDF: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def get_filename(report_type: str, format: str = "csv") -> str:
        """
        Generate filename for export
        
        Args:
            report_type: Type of report (anomalies, predictions, budgets)
            format: File format (csv or pdf)
            
        Returns:
            Filename with timestamp
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"{report_type}_{timestamp}.{format}"


# Export public interface
__all__ = [
    "ExportService",
]
