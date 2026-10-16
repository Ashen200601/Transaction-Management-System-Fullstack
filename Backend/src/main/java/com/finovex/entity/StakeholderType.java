package com.finovex.entity;

import java.util.Date;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.finovex.enums.MasterDataStatus;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/** What part a stakeholder plays for a business, e.g. CUSTOMER or VENDOR. Shared by every business; seeded by migration. */
@Entity
@Table(name = "stakeholder_type")
@EntityListeners(AuditingEntityListener.class)
public class StakeholderType {
    private Integer stakeholderTypeSeq;
    private String stakeholderTypeCode;
    private String stakeholderTypeName;
    private Integer status;
    private String statusDescription;
    private String createdBy;
    private Date createdDate;
    private String lastModifiedBy;
    private Date lastModifiedDate;


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
    @SequenceGenerator(name = "G1", sequenceName = "stakeholder_type_seq", allocationSize = 1)
    @Column(name = "stakeholder_type_seq", unique = true)
    public Integer getStakeholderTypeSeq() {
        return stakeholderTypeSeq;
    }

    public void setStakeholderTypeSeq(Integer stakeholderTypeSeq) {
        this.stakeholderTypeSeq = stakeholderTypeSeq;
    }

    /** Short upper-case code, e.g. VENDOR. Unique among types that aren't deleted. */
    @Basic
    @Column(name = "stakeholder_type_code", length = 20, nullable = false)
    public String getStakeholderTypeCode() {
        return stakeholderTypeCode;
    }

    public void setStakeholderTypeCode(String stakeholderTypeCode) {
        this.stakeholderTypeCode = stakeholderTypeCode;
    }

    /** What people call it, e.g. Vendor. */
    @Basic
    @Column(name = "stakeholder_type_name", length = 60, nullable = false)
    public String getStakeholderTypeName() {
        return stakeholderTypeName;
    }

    public void setStakeholderTypeName(String stakeholderTypeName) {
        this.stakeholderTypeName = stakeholderTypeName;
    }

    @Basic
    @Column(name = "status", nullable = true)
    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
        if (status != null) {
            this.setStatusDescription(MasterDataStatus.findOne(status).getStatus());
        }
    }

    @Basic
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @Basic
    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    @Basic
    @LastModifiedBy
    @Column(name = "last_modified_by")
    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Basic
    @LastModifiedDate
    @Column(name = "last_modified_date", nullable = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(Date lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    @Transient
    public String getStatusDescription() {
        return statusDescription;
    }

    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }
}
